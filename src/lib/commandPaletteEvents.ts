// Lightweight event bus so the Command Palette can drive flows that live
// inside feature components (e.g. opening a member's detail dialog from the
// Members tab) without prop-drilling a heavy hook instance up to App.
import type { Member } from "@/types";

type OpenMemberHandler = (m: Member) => void;
type VoidHandler = () => void;

const openMemberListeners = new Set<OpenMemberHandler>();
const addMemberListeners = new Set<VoidHandler>();

export function requestOpenMember(member: Member) {
  openMemberListeners.forEach((cb) => cb(member));
}

export function onRequestOpenMember(cb: OpenMemberHandler) {
  openMemberListeners.add(cb);
  return () => openMemberListeners.delete(cb);
}

export function requestAddMember() {
  addMemberListeners.forEach((cb) => cb());
}

export function onRequestAddMember(cb: VoidHandler) {
  addMemberListeners.add(cb);
  return () => addMemberListeners.delete(cb);
}
