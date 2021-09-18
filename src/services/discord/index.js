"use strict";
const phin = require("phin");

const APIError = require("./errors");

const User = require("./types/user"),
  GuildMember = require("./types/guildMember");

/**
 * The interface for interacting with the discord api
 * @property {object} ClientUser The current user.
 * @property {object} auth The object containing the access_token.
 *
 * @param {string} id The client id.
 * @param {string} secret The secret.
 */
class DiscordClient {
  constructor(id, secret, redirect_uri, code) {
    this._baseUrl = "https://discord.com/api";
    this._redirect_uri = redirect_uri;
    this._id = id;
    this._secret = secret;
    // this._clientUser = typeof code === "string" && code ? this.setClientUser.call(this, code) : null;
  }

  get ClientUser() {
    return this._clientUser;
  }

  /**
   * Retrieves access token and uses it to grab the current user.
   * @param {string} code The code we use to retrieve the access token for the user.
   * @returns {promise<Object>}
   */
  getCurrentUser(code) {
    return new Promise(async (resolve, reject) => {
      try {
        const access = await this.getAccess(code);
        const user = await this.getUser(access);
        resolve(user);
      } catch (err) {
        reject(err);
        console.log(err);
      }
    });
  }

  /**
   * Returns a promise which resolves to an object with access_token, refresh_token and ttl.
   * @param {string} code The string we use to exchange for our access token.
   * @returns {promise<Object>}
   */
  async getAccess(code) {
    return new Promise(async (resolve, reject) => {
      if (typeof code !== "string" && code === "") {
        reject(new Error("Authorization code not provided."));
      }

      try {
        const resp = await phin({
          method: "POST",
          url: `${this._baseUrl}/oauth2/token`,
          parse: "json",
          form: {
            client_id: this._id,
            client_secret: this._secret,
            grant_type: "authorization_code",
            redirect_uri: this._redirect_uri,
            code: code,
            scope: "identity email guilds",
          },
        });

        resolve(resp.body);
      } catch (err) {
        reject(
          err.error
            ? new Error(err.error)
            : new APIError(err["phinResponse"].statusCode)
        );
      }
    });
  }

  /**
   * Returns a promise that resolves to an object containing the guild member user.
   * @param {object} token The object containing the access_token and token type.
   * @param {string} guildId The id in string format of the guild.
   * @param {string} userId  The id in string format of the user belonging to the guild.
   *
   * @returns {promise<Object>}
   */
  async getGuildMember(token, guildId, userId) {
    return new Promise(async (resolve, reject) => {
      if (!token) {
        reject(new Error("Missing BOT token."));
      }

      try {
        const resp = await phin({
          url: `${this._baseUrl}/guilds/${guildId}/members/${userId}`,
          method: "GET",
          headers: {
            Authorization: `Bot ${token}`,
          },
          parse: "json",
        });
        resolve(new GuildMember(resp.body));
      } catch (err) {
        console.log(err);
        reject(
          err.error
            ? new Error(err.error)
            : new APIError(err["phinResponse"].statusCode)
        );
      }
    });
  }

  /**
   * Returns a promise which resolves to an object containing the current user.
   * @param {object} token The object containing the access_token and token type.
   *
   * @returns {promise<Object>}
   */
  async getUser(token) {
    return new Promise(async (resolve, reject) => {
      if (!token.hasOwnProperty("access_token")) {
        reject(new Error("Missing access_token."));
      }
      if (!token.hasOwnProperty("token_type"))
        reject(new Error("Missing token type."));
      try {
        const resp = await phin({
          url: `${this._baseUrl}/users/@me`,
          method: "GET",
          headers: {
            Authorization: `${token.token_type} ${token.access_token}`,
          },
          parse: "json",
        });

        resolve(new User(resp.body));
      } catch (err) {
        reject(
          err.error
            ? new Error(err.error)
            : new APIError(err["phinResponse"].statusCode)
        );
      }
    });
  }
}

module.exports = DiscordClient;
