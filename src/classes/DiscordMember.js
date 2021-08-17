export default class DiscordMember {
  constructor(oldMember, newMember) {
    const oldRoles = oldMember._roles;
    const newRoles = newMember._roles;

    this.id = newMember.id;
    this.roles = newRoles;
    this.old = oldRoles;
    /** CHECK TO SEE IF A ROLE IS BEING REMOVED */
    this.removing = oldRoles.some((role) => !newRoles.includes(role));
  }

  get role() {
    if (this.removing) {
      return this.old.filter((role) => !this.roles.includes(role))[0];
    } else {
      return this.roles.filter((role) => !this.old.includes(role))[0];
    }
  }
}
