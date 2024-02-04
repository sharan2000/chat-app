const { Model } = require('objection');

class UserRequests extends Model {
  static get tableName() {
    return 'user_requests';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        from_user_id: { type: 'integer' },
        to_user_id : { type: 'integer' },
        sent_at: { type: 'string' },
      }
    };
  }
}

module.exports = UserRequests