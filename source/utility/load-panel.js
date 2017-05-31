/**---------------------------------------------------------------------------------------------------------------------
 * field-service/source/utility/load-panel.js
 */

site.loadPanel = function (cmd, doc, callback) {
  $.get(doc, function (data) {
    if (tgi.left(data, 5) == '<!DOC')
      data = '`error loading document:' + doc + '`';
    cmd.contents.set('contents', [data]);
    callback(cmd);
  });
};
