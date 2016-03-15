/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/utility/safe-delete.js
 */

site.safeDelete = function (name, callback) {
  app.ask('If you are SURE you want to delete this ' + name + 'type the word DELETE:', new tgi.Attribute({name: 'answer', value: ''}), function (reply) {
    if (reply && reply.toUpperCase() == 'DELETE')
      callback();
  });
};
