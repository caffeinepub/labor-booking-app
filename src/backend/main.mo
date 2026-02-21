import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Char "mo:core/Char";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
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
    details : ?Text;
  };

  public type Service = {
    name : Text;
    price : Nat;
    description : Text;
  };

  public type Laborer = {
    id : Principal;
    laborId : Text;
    name : Text;
    skills : [Text];
    services : List.List<Service>;
    location : Text;
    contact : Text;
    mobileNumber : Text;
    availability : Availability;
    bookings : List.List<Booking>;
  };

  public type LaborerData = {
    id : Principal;
    laborId : Text;
    name : Text;
    skills : [Text];
    services : [Service];
    location : Text;
    contact : Text;
    mobileNumber : Text;
    availability : Availability;
    bookings : [Booking];
  };

  public type LaborerInput = {
    name : Text;
    skills : [Text];
    services : [Service];
    location : Text;
    contact : Text;
    mobileNumber : Text;
    availability : Availability;
  };

  public type BookingInput = {
    targetLaborer : Principal;
    serviceType : Text;
    dateTime : Time.Time;
    durationHours : Nat;
    location : Text;
    details : ?Text;
  };

  public type BookingResponse = {
    #ok : Nat;
    #laborerNotFound;
    #callerNotAuthorizedToBook;
    #invalidFieldValues;
  };

  public type UserProfile = {
    name : Text;
  };

  let laborersStore = Map.empty<Principal, Laborer>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextBookingId = 0;
  var nextLaborId = 1;

  func generateLaborId() : Text {
    let paddedNumber = nextLaborId.toText();
    nextLaborId += 1;
    "LAB-" # paddedNumber;
  };

  func validateMobileNumber(number : Text) : Bool {
    if (number.size() != 10) { return false };
    for (c in number.chars()) {
      if (not c.isDigit()) { return false };
    };
    true;
  };

  public shared ({ caller }) func saveCallerLaborer(laborerInput : LaborerInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    if (not validateMobileNumber(laborerInput.mobileNumber)) {
      Runtime.trap("Invalid mobile number format. Must be 10 digits.");
    };

    let laborer : Laborer = {
      id = caller;
      laborId = generateLaborId();
      name = laborerInput.name;
      skills = laborerInput.skills;
      services = List.fromArray(laborerInput.services);
      location = laborerInput.location;
      contact = laborerInput.contact;
      mobileNumber = laborerInput.mobileNumber;
      availability = laborerInput.availability;
      bookings = List.empty<Booking>();
    };
    laborersStore.add(caller, laborer);
  };

  public shared ({ caller }) func getLaborerById(laborerId : Principal) : async ?LaborerData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view laborer profiles");
    };
    switch (laborersStore.get(laborerId)) {
      case (null) { null };
      case (?laborer) {
        ?{
          id = laborer.id;
          laborId = laborer.laborId;
          name = laborer.name;
          skills = laborer.skills;
          services = laborer.services.toArray();
          location = laborer.location;
          contact = laborer.contact;
          mobileNumber = laborer.mobileNumber;
          availability = laborer.availability;
          bookings = laborer.bookings.toArray();
        };
      };
    };
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
          laborId = laborer.laborId;
          name = laborer.name;
          skills = laborer.skills;
          services = laborer.services.toArray();
          location = laborer.location;
          contact = laborer.contact;
          mobileNumber = laborer.mobileNumber;
          availability = laborer.availability;
          bookings = laborer.bookings.toArray();
        };
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
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
            laborId = laborer.laborId;
            name = laborer.name;
            skills = laborer.skills;
            services = laborer.services.toArray();
            location = laborer.location;
            contact = laborer.contact;
            mobileNumber = laborer.mobileNumber;
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

  public shared ({ caller }) func createBooking(bookingData : BookingInput) : async BookingResponse {
    // Access control check
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #callerNotAuthorizedToBook;
    };

    // Validation checks for mandatory fields
    if (bookingData.serviceType.size() == 0 or bookingData.location.size() == 0 or bookingData.durationHours == 0) {
      return #invalidFieldValues;
    };

    // Verify target laborer exists
    let targetLaborer = switch (laborersStore.get(bookingData.targetLaborer)) {
      case (null) { return #laborerNotFound };
      case (?laborer) { laborer };
    };

    // Generate booking Id
    let bookingId = nextBookingId;
    nextBookingId += 1;

    let booking : Booking = {
      id = bookingId;
      requester = caller;
      targetLaborer = bookingData.targetLaborer;
      serviceType = bookingData.serviceType;
      dateTime = bookingData.dateTime;
      durationHours = bookingData.durationHours;
      status = #pending;
      location = bookingData.location;
      details = bookingData.details;
    };

    // Prepend new booking so we do not need to traverse the entire list
    let updatedBookings = List.singleton<Booking>(booking);

    // Update laborer record using copy-on-write pattern
    let updatedLaborer = {
      id = targetLaborer.id;
      laborId = targetLaborer.laborId;
      name = targetLaborer.name;
      skills = targetLaborer.skills;
      services = targetLaborer.services;
      location = targetLaborer.location;
      contact = targetLaborer.contact;
      mobileNumber = targetLaborer.mobileNumber;
      availability = targetLaborer.availability;
      bookings = updatedBookings;
    };

    laborersStore.add(bookingData.targetLaborer, updatedLaborer);

    #ok(bookingId);
  };

  public shared ({ caller }) func getBookablesNearLocation(location : Text, radius : Nat) : async [LaborerData] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access this endpoint");
    };
    laborersStore.values().map(
      func(laborer) {
        {
          id = laborer.id;
          laborId = laborer.laborId;
          name = laborer.name;
          skills = laborer.skills;
          services = laborer.services.toArray();
          location = laborer.location;
          contact = laborer.contact;
          mobileNumber = laborer.mobileNumber;
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

    var foundLaborer : ?Laborer = null;
    var foundBooking : ?Booking = null;

    for ((_, laborer) in laborersStore.entries()) {
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

    if (caller != booking.requester and caller != booking.targetLaborer) {
      Runtime.trap("Unauthorized: Only the requester or target laborer can update");
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
            details = b.details;
          };
        } else { b };
      }
    );

    let updatedLaborer = {
      id = laborer.id;
      laborId = laborer.laborId;
      name = laborer.name;
      skills = laborer.skills;
      services = laborer.services;
      location = laborer.location;
      contact = laborer.contact;
      mobileNumber = laborer.mobileNumber;
      availability = laborer.availability;
      bookings = updatedBookings;
    };

    laborersStore.add(laborer.id, updatedLaborer);
  };

  public shared ({ caller }) func updateBookingDetails(bookingId : Nat, details : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update bookings");
    };

    var foundLaborer : ?Laborer = null;
    var foundBooking : ?Booking = null;

    for ((_, laborer) in laborersStore.entries()) {
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

    if (caller != booking.targetLaborer) {
      Runtime.trap("Unauthorized: Only the target laborer can update details");
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
            status = b.status;
            location = b.location;
            details = ?details;
          };
        } else { b };
      }
    );

    let updatedLaborer = {
      id = laborer.id;
      laborId = laborer.laborId;
      name = laborer.name;
      skills = laborer.skills;
      services = laborer.services;
      location = laborer.location;
      contact = laborer.contact;
      mobileNumber = laborer.mobileNumber;
      availability = laborer.availability;
      bookings = updatedBookings;
    };

    laborersStore.add(laborer.id, updatedLaborer);
  };
};
