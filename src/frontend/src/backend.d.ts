import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface LaborerInput {
    contact: string;
    name: string;
    availability: Availability;
    skills: Array<string>;
    location: string;
    services: Array<Service>;
}
export type Time = bigint;
export interface Availability {
    status: {
        __kind__: "pending";
        pending: null;
    } | {
        __kind__: "onJob";
        onJob: null;
    } | {
        __kind__: "custom";
        custom: string;
    } | {
        __kind__: "available";
        available: null;
    } | {
        __kind__: "unavailable";
        unavailable: null;
    };
    lastUpdated: Time;
}
export interface BookingInput {
    serviceType: string;
    targetLaborer: Principal;
    durationHours: bigint;
    details?: string;
    dateTime: Time;
    location: string;
}
export interface Service {
    name: string;
    description: string;
    price: bigint;
}
export type BookingResponse = {
    __kind__: "ok";
    ok: bigint;
} | {
    __kind__: "laborerNotFound";
    laborerNotFound: null;
} | {
    __kind__: "callerNotAuthorizedToBook";
    callerNotAuthorizedToBook: null;
} | {
    __kind__: "invalidFieldValues";
    invalidFieldValues: null;
};
export interface Booking {
    id: bigint;
    status: BookingStatus;
    serviceType: string;
    requester: Principal;
    targetLaborer: Principal;
    durationHours: bigint;
    details?: string;
    dateTime: Time;
    location: string;
}
export interface LaborerData {
    id: Principal;
    contact: string;
    bookings: Array<Booking>;
    name: string;
    availability: Availability;
    skills: Array<string>;
    location: string;
    services: Array<Service>;
}
export interface UserProfile {
    name: string;
}
export enum BookingStatus {
    cancelled = "cancelled",
    pending = "pending",
    completed = "completed",
    confirmed = "confirmed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBooking(bookingData: BookingInput): Promise<BookingResponse>;
    getBookablesNearLocation(location: string, radius: bigint): Promise<Array<LaborerData>>;
    getCallerLaborer(): Promise<LaborerData | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLaborerById(laborerId: Principal): Promise<LaborerData | null>;
    getLaborersByNeighborhood(neighborhood: string): Promise<Array<LaborerData>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerLaborer(laborerInput: LaborerInput): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateBookingDetails(bookingId: bigint, details: string): Promise<void>;
    updateBookingStatus(bookingId: bigint, status: BookingStatus): Promise<void>;
}
