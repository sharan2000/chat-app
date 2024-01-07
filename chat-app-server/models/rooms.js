const { Model } = require('objection');

class Users extends Model {
  static get tableName() {
    return 'rooms';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        roomname: { type: 'string', minLength: 1, maxLength: 255 },
      }
    };
  }
}

module.exports = Users