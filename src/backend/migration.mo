import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type OldBooking = {
    id : Nat;
    requester : Principal.Principal;
    targetLaborer : Principal.Principal;
    serviceType : Text;
    dateTime : Time.Time;
    durationHours : Nat;
    status : {
      #pending;
      #confirmed;
      #completed;
      #cancelled;
    };
    location : Text;
    details : ?Text;
  };

  type OldService = {
    name : Text;
    price : Nat;
    description : Text;
  };

  type OldLaborer = {
    id : Principal.Principal;
    laborId : Text;
    name : Text;
    skills : [Text];
    services : List.List<OldService>;
    location : Text;
    contact : Text;
    mobileNumber : Text;
    availability : {
      status : {
        #available;
        #unavailable;
        #onJob;
        #pending;
        #custom : Text;
      };
      lastUpdated : Time.Time;
    };
    bookings : List.List<OldBooking>;
  };

  type OldActor = {
    laborersStore : Map.Map<Principal.Principal, OldLaborer>;
    userProfiles : Map.Map<Principal.Principal, { name : Text }>;
    nextBookingId : Nat;
    nextLaborId : Nat;
  };

  type NewBooking = OldBooking;

  type NewService = {
    name : Text;
    priceInInr : Nat;
    description : Text;
  };

  type NewLaborer = {
    id : Principal.Principal;
    laborId : Text;
    name : Text;
    skills : [Text];
    services : List.List<NewService>;
    location : Text;
    contact : Text;
    mobileNumber : Text;
    availability : {
      status : {
        #available;
        #unavailable;
        #onJob;
        #pending;
        #custom : Text;
      };
      lastUpdated : Time.Time;
    };
    bookings : List.List<NewBooking>;
  };

  type NewActor = {
    laborersStore : Map.Map<Principal.Principal, NewLaborer>;
    userProfiles : Map.Map<Principal.Principal, { name : Text }>;
    nextBookingId : Nat;
    nextLaborId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newLaborersStore = old.laborersStore.map<Principal.Principal, OldLaborer, NewLaborer>(
      func(_id, oldLaborer) {
        let newServices = oldLaborer.services.map<OldService, NewService>(
          func(oldService) {
            {
              name = oldService.name;
              priceInInr = oldService.price;
              description = oldService.description;
            };
          }
        );
        { oldLaborer with services = newServices };
      }
    );
    { old with laborersStore = newLaborersStore };
  };
};
