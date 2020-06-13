const User = require("./user");

/**
 * A guild member of the specified guild that is also the user.
 * @property {Object} user the user object.
 * @property {Object} userWithRoles the user object with roles included.
 * @property {Array<String>} roles A list of roles that return string ids.
 * @property {String} nick The string which returns the user's name for the guild.
 * @property {Date} joinedAt The timestamp of when the user joined the guild.
 * @property {Boolean} deaf Whether the user is muted or not.
 * @property {Boolean} mute Whether the user is deaf or not.
 *
 * @method getRole returns a specific guild member role based on id
 * @method hasRole returns whether or not the guild member belongs to a certain role.
 */

class GuildMember {
  constructor({ user, nick, roles, joined_at, deaf, muted }) {
    this._user = new User(user);
    this._nick = nick;
    this._roles = roles;
    this._joined_at = joined_at;
    this._deaf = deaf;
    this._muted = muted;
  }

  get user() {
    return this._user;
  }

  get userWithRoles() {
    const user = this._user;
    user.roles = this._roles;
    return user;
  }

  get roles() {
    return this._roles;
  }

  get nick() {
    return this._nick;
  }

  get joinedAt() {
    return this_.joined_at;
  }

  get deaf() {
    return this._deaf;
  }

  get mute() {
    return this._muted;
  }

  /**
   * Returns a role id
   * @param {string} id
   * @returns {string}
   */
  getRole(id) {
    const idx = this._roles.indexOf(id);
    if (idx !== -1) return this._roles[idx];
    else null;
  }

  /**
   * Returns true or false if the user belongs to a specific role
   * @param {string} id
   * @returns {boolean}
   */
  hasRole(id) {
    return this._roles.indexOf(id) !== -1;
  }
}

module.exports = GuildMember;
