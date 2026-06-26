export type RoomType = "standard" | "ground" | "contact";

export type Room = {
    id: string | number;
    name: string;
    type: RoomType;
};

export type Optometrist = {
    id: number;
    initials: string;
    fullName: string;
};