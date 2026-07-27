import { Optometrist, Room } from "./types";

export const rooms: Room[] = [
    { id: "ground-floor", name: "Ground Floor", type: "ground" },
    { id: "room-1", name: "Room 1", type: "standard" },
    { id: "room-2", name: "Room 2", type: "standard" },
    { id: "room-3", name: "Room 3", type: "standard" },
    { id: "room-4", name: "Room 4", type: "standard" },
    { id: "room-5", name: "Room 5", type: "standard" },
    { id: "room-6", name: "Room 6", type: "standard" },
    { id: "room-7", name: "Room 7", type: "standard" },
    { id: "cl-10", name: "Contact Lens 10", type: "contact" },
    { id: "cl-11", name: "Contact Lens 11", type: "contact" },
];

export const optometrists: Optometrist[] = [
    { id: "alex-brown", initials: "AB", fullName: "Alex Brown" },
    { id: "sarah-mitchell", initials: "SM", fullName: "Sarah Mitchell" },
    { id: "james-daniels", initials: "JD", fullName: "James Daniels" },
    { id: "emily-roberts", initials: "ER", fullName: "Emily Roberts" },
    { id: "daniel-lee", initials: "DL", fullName: "Daniel Lee" },
    { id: "laura-white", initials: "LW", fullName: "Laura White" },
    { id: "tom-kelly", initials: "TK", fullName: "Tom Kelly" },
    { id: "nina-shah", initials: "NS", fullName: "Nina Shah" },
    { id: "michael-tran", initials: "MT", fullName: "Michael Tran" },
    { id: "helen-wright", initials: "HW", fullName: "Helen Wright" },
    { id: "ryan-patel", initials: "RP", fullName: "Ryan Patel" },
];