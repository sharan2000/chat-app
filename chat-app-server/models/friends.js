const { Model } = require('objection');

class Friends extends Model {
  static get tableName() {
    return 'friends';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        user1_id: { type: 'integer' },
        user2_id: { type: 'integer' },
      }
    };
  }
}

module.exports = Friends