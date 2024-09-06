export type User = {
    email: string;
    name: string;
    prefs?: { [key: string]: string };
}
