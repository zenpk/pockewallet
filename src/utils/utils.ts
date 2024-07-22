import { COOKIE_ID } from "./consts";

export function getUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function genRandomColor() {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`;
}

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

type Id = {
  username: string;
  uuid: string;
};

function parseId(id: string) {
  return JSON.parse(atob(id)) as Id;
}

export function getIdFromCookie() {
  const id = getCookie(COOKIE_ID);
  if (!id) {
    return null;
  }
  return parseId(id);
}
