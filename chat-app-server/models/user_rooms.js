const { Model } = require('objection');

class UserRooms extends Model {
  static get tableName() {
    return 'user_rooms';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        user_id: { type: 'integer' },
        room_id: { type: 'integer' },
      }
    };
  }
}

module.exports = UserRooms