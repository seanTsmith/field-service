/**---------------------------------------------------------------------------------------------------------------------
 * field-service/importCustomers.js
 */
var XLS = require('xlsjs');

var wb = XLS.readFile('import/Customers.xls');

var js = XLS.utils.sheet_to_json(wb)

console.log('sup');