import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type Availability = {
    status : {
      #available;
      #unavailable;
      #onJob;
      #pending;
      #custom : Text;
    };
    lastUpdated : Time.Time;
  };

  public type BookingStatus = {
    #pending;
    #confirmed;
    #completed;
    #cancelled;
  };

  public type Booking = {
    id : Nat;
    requester : Principal;
    targetLaborer : Principal;
    serviceType : Text;
    dateTime : Time.Time;
    durationHours : Nat;
    status : BookingStatus;
    location : Text;
  };

  public type Service = {
    name : Text;
    price : Nat;
    description : Text;
  };

  public type Laborer = {
    id : Principal;
    name : Text;
    skills : [Text];
    services : List.List<Service>;
    location : Text;
    contact : Text;
    availability : Availability;
    bookings : List.List<Booking>;
  };

  public type LaborerData = {
    id : Principal;
    name : Text;
    skills : [Text];
    services : [Service];
    location : Text;
    contact : Text;
    availability : Availability;
    bookings : [Booking];
  };

  public type LaborerInput = {
    name : Text;
    skills : [Text];
    services : [Service];
    location : Text;
    contact : Text;
    availability : Availability;
  };

  public type BookingInput = {
    targetLaborer : Principal;
    serviceType : Text;
    dateTime : Time.Time;
    durationHours : Nat;
    location : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  let laborersStore = Map.empty<Principal, Laborer>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextBookingId = 0;

  public shared ({ caller }) func saveCallerLaborer(laborerInput : LaborerInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let laborer : Laborer = {
      id = caller;
      name = laborerInput.name;
      skills = laborerInput.skills;
      services = List.fromArray(laborerInput.services);
      location = laborerInput.location;
      contact = laborerInput.contact;
      availability = laborerInput.availability;
      bookings = List.empty<Booking>();
    };
    laborersStore.add(caller, laborer);
  };

  public shared ({ caller }) func getCallerLaborer() : async ?LaborerData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    switch (laborersStore.get(caller)) {
      case (null) { null };
      case (?laborer) {
        ?{
          id = laborer.id;
          name = laborer.name;
          skills = laborer.skills;
          services = laborer.services.toArray();
          location = laborer.location;
          contact = laborer.contact;
          availability = laborer.availability;
          bookings = laborer.bookings.toArray();
        };
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func getLaborersByNeighborhood(neighborhood : Text) : async [LaborerData] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search for laborers");
    };
    laborersStore.values().map<Laborer, ?LaborerData>(
      func(laborer) {
        if (Text.equal(laborer.location, neighborhood)) {
          ?{
            id = laborer.id;
            name = laborer.name;
            skills = laborer.skills;
            services = laborer.services.toArray();
            location = laborer.location;
            contact = laborer.contact;
            availability = laborer.availability;
            bookings = laborer.bookings.toArray();
          };
        } else {
          null;
        };
      }
    ).filter(
      func(data) {
        switch (data) {
          case (?_) { true };
          case (null) { false };
        };
      }
    ).map(
      func(data) {
        switch (data) {
          case (?d) { d };
          case (null) { Runtime.trap("Unexpected error: null value in filter") };
        };
      }
    ).toArray();
  };

  public shared ({ caller }) func createBooking(bookData : BookingInput) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can book laborers");
    };

    // Verify target laborer exists
    let targetLaborer = switch (laborersStore.get(bookData.targetLaborer)) {
      case (null) { Runtime.trap("Target laborer does not exist") };
      case (?laborer) { laborer };
    };

    let bookingId = nextBookingId;
    nextBookingId += 1;

    let booking : Booking = {
      id = bookingId;
      requester = caller;
      targetLaborer = bookData.targetLaborer;
      serviceType = bookData.serviceType;
      dateTime = bookData.dateTime;
      durationHours = bookData.durationHours;
      status = #pending;
      location = bookData.location;
    };

    let updatedBookings = targetLaborer.bookings;
    let updatedLaborer = {
      id = targetLaborer.id;
      name = targetLaborer.name;
      skills = targetLaborer.skills;
      services = targetLaborer.services;
      location = targetLaborer.location;
      contact = targetLaborer.contact;
      availability = targetLaborer.availability;
      bookings = updatedBookings;
    };

    laborersStore.add(bookData.targetLaborer, updatedLaborer);
    bookingId;
  };

  public shared ({ caller }) func getBookablesNearLocation(location : Text, radius : Nat) : async [LaborerData] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access this endpoint");
    };
    laborersStore.values().map(
      func(laborer) {
        {
          id = laborer.id;
          name = laborer.name;
          skills = laborer.skills;
          services = laborer.services.toArray();
          location = laborer.location;
          contact = laborer.contact;
          availability = laborer.availability;
          bookings = laborer.bookings.toArray();
        };
      }
    ).toArray();
  };

  public shared ({ caller }) func updateBookingStatus(bookingId : Nat, status : BookingStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update bookings");
    };

    // Find which laborer has this booking
    var foundLaborer : ?Laborer = null;
    var foundBooking : ?Booking = null;

    for ((principal, laborer) in laborersStore.entries()) {
      let bookingOpt = laborer.bookings.find(func(b : Booking) : Bool { b.id == bookingId });
      switch (bookingOpt) {
        case (?booking) {
          foundLaborer := ?laborer;
          foundBooking := ?booking;
        };
        case null {};
      };
    };

    let laborer = switch (foundLaborer) {
      case (null) { Runtime.trap("Booking does not exist") };
      case (?l) { l };
    };

    let booking = switch (foundBooking) {
      case (null) { Runtime.trap("Booking does not exist") };
      case (?b) { b };
    };

    // Authorization: Only the booking requester or the target laborer can update the booking
    if (caller != booking.requester and caller != booking.targetLaborer) {
      Runtime.trap("Unauthorized: Only the booking requester or target laborer can update this booking");
    };

    let updatedBookings = laborer.bookings.map<Booking, Booking>(
      func(b : Booking) : Booking {
        if (b.id == bookingId) {
          {
            id = b.id;
            requester = b.requester;
            targetLaborer = b.targetLaborer;
            serviceType = b.serviceType;
            dateTime = b.dateTime;
            durationHours = b.durationHours;
            status;
            location = b.location;
          };
        } else { b };
      }
    );

    let updatedLaborer = {
      id = laborer.id;
      name = laborer.name;
      skills = laborer.skills;
      services = laborer.services;
      location = laborer.location;
      contact = laborer.contact;
      availability = laborer.availability;
      bookings = updatedBookings;
    };

    laborersStore.add(laborer.id, updatedLaborer);
  };
};
