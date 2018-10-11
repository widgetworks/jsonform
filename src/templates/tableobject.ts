import {ITableObjectRenderData} from "../lib/types/inputtypes";
import {FormNode} from "../lib/FormNode";
import _ from "lodash";
import {IRenderData} from "../lib/types/IRenderData";
import {ITemplateMap} from "../lib/types/ITemplate";

var inputs: ITemplateMap = {
    'tableobject': {
		// A sub-child of tablearray.
		// Need to know if we should render the header.
		// 'template': '<tbody><tr><td>table object</td></tr></tbody>',
		'template': `

<tbody id="<%= id %>">
	<%= children %>
</tbody>

`,
		'fieldtemplate': false,
		'childSelector': '> tbody',
		'onBeforeRender': function(data: ITableObjectRenderData, node: FormNode) {
			// Check the index here -> output that in the 
			//console.log('tableobject: data=', data, '\nnode=', node);

			// Create a map of children and their types.
			// Simple children just go in a <td> but complex types might need their own <tr>.
			//data.
			data.childMap = {
				simple: [], // a single row holds everything, wrap each item in a <td></td>
				complex: [] // a single row for every item, wrap each item in a <tr><td colspan="x"></td></tr>
			};

			// TODO: Handle multiple <tr> elements for nested tables.
			// TODO: Need to count the number of 'simple' elements that will form the rows.
			if (data.schema && data.schema.properties) {
				var simpleCount = 0;
				_.each(data.schema.properties, function(dataType) {
					if (dataType.type != 'array') {
						simpleCount++;
					}
				});
				data.columnCount = simpleCount;
			}
		},
		'childTemplate': function(inner, data: IRenderData, node: FormNode, parentData: IRenderData, parentNode: FormNode) {
			//'<td></td>'
			// TODO: How do we know how many children we have?

			// // Check the child's type.
			// if (parentData.childMap && node.schemaElement){
			//   if (node.schemaElement.type == 'array'){
			//     // Complex type.
			//     // TODO: Need to know the colspan.
			//     parentData.childMap.complex.push('<tr>', '<td colspan="'+parentData.columnCount+'">', inner, '</td>', '</tr>');
			//   } else {
			//     // simple type
			//     parentData.childMap.simple.push('<td>'+inner+'</td>');
			//   }
			// }

			// return inner;
			return '<td>' + inner + '</td>';
		},
		onAfterRender: function(data, node) {


			// if (data.childMap){
			//   var childMap = data.childMap;
			//   // NOTE: At some point we need to wrap the simple elements in a row.
			//   // Squash the child data down to a string and then set as `node.children`.
			//   if (childMap.simple.length){
			//     childMap.simple.unshift('<tr>');
			//     childMap.simple.push('</tr>');
			//   }

			//   data.children = childMap.simple.join('') + childMap.complex.join('');
			// }
		}
	},
};

export default inputs;
