export type User = {
    id: string,
    email: string;
    name: string;
    prefs?: { [key: string]: string };
}
