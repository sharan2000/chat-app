const { Model } = require('objection');

class Messages extends Model {
  static get tableName() {
    return 'messages';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        from: { type: 'string', minLength: 1, maxLength: 255 },
        to: { type: 'string', minLength: 1, maxLength: 255 },
        message: { type: 'string', minLength: 1, maxLength: 3000 },
        time: { type: 'string' }
      }
    };
  }
}

module.exports = Messages