import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Text "mo:core/Text";

module {
  type OldAvailability = {
    status : { #available; #unavailable; #onJob; #pending; #custom : Text };
    lastUpdated : Int;
  };

  type OldBooking = {
    id : Nat;
    requester : Principal;
    targetLaborer : Principal;
    serviceType : Text;
    dateTime : Int;
    durationHours : Nat;
    status : { #pending; #confirmed; #completed; #cancelled };
    location : Text;
    details : ?Text;
  };

  type OldService = {
    name : Text;
    price : Nat;
    description : Text;
  };

  type OldLaborer = {
    id : Principal;
    name : Text;
    skills : [Text];
    services : List.List<OldService>;
    location : Text;
    contact : Text;
    availability : OldAvailability;
    bookings : List.List<OldBooking>;
  };

  type OldActor = {
    laborersStore : Map.Map<Principal, OldLaborer>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    nextBookingId : Nat;
  };

  type NewLaborer = {
    id : Principal;
    laborId : Text;
    name : Text;
    skills : [Text];
    services : List.List<OldService>;
    location : Text;
    contact : Text;
    mobileNumber : Text;
    availability : OldAvailability;
    bookings : List.List<OldBooking>;
  };

  type NewActor = {
    laborersStore : Map.Map<Principal, NewLaborer>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    nextBookingId : Nat;
    nextLaborId : Nat;
  };

  func generateLaborId(principal : Principal) : Text {
    principal.toText();
  };

  func defaultMobileNumber() : Text {
    "0000000000";
  };

  public func run(old : OldActor) : NewActor {
    let transformedLaborers = old.laborersStore.map<Principal, OldLaborer, NewLaborer>(
      func(principal, oldLaborer) {
        {
          oldLaborer with
          laborId = generateLaborId(principal);
          mobileNumber = defaultMobileNumber();
        };
      }
    );
    {
      laborersStore = transformedLaborers;
      userProfiles = old.userProfiles;
      nextBookingId = old.nextBookingId;
      nextLaborId = transformedLaborers.size();
    };
  };
};
