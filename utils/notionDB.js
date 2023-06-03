require('dotenv').config();
const { Client } = require("@notionhq/client")

const notion = new Client({ auth: process.env.NOTION_KEY })

const databaseId = process.env.NOTION_DATABASE_ID

// async function addItem(text, email, tel, msg, code) {
// 	try {
// 		const response = await notion.pages.create({
// 			parent: { database_id: databaseId },
// 			properties: {
// 				title: {
// 					title: [
// 						{
// 							"text": {
// 								"content": text || ""
// 							}
// 						}
// 					]
// 				},
// 				"Email": {
// 					"email": email || ""
// 				},
// 				"Telefono": {
// 					"text": tel || ""
// 				},
// 				"Mensaje": {
// 					"text": msg || ""
// 				},
// 				"Codigo_de_seguimiento": {
// 					"text": code || ""
// 				},
// 			},
// 		})
// 		// console.log(response)
// 		console.log("Success! Entry added.")
// 	} catch (error) {
// 		console.error(error.body)
// 		console.log(databaseId)

// 	}
// }


async function addItem(text, email, tel, msg, code) {
	try {
		const response = await notion.pages.create({
			parent: { database_id: databaseId },
			properties: {
				title: {
					title: [
						{
							text: {
								content: text || ""
							}
						}
					]
				},
				Email: {
					email: email || ""
				},
				Telefono: {
					rich_text: [
						{
							text: {
								content: tel || ""
							}
						}
					]
				},
				Mensaje: {
					rich_text: [
						{
							text: {
								content: msg || ""
							}
						}
					]
				},
				Codigo_de_seguimiento: {
					rich_text: [
						{
							text: {
								content: code || ""
							}
						}
					]
				},
			},
		});

		console.log("Success! Entry added.");
	} catch (error) {
		console.error(error.body);
		console.log(databaseId);
	}
}


module.exports = { addItem }
