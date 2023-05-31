const { Configuration, OpenAIApi } = require("openai");
const OPENAI_API_KEY = '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'
const configuration = new Configuration({
	organization: "org-MmVKplQsP0ewzUOTgZG1fyoE",
	apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
// const response = await openai.listEngines();
const axios = require('axios');

function validarDNI(dni) {
	// Expresión regular para validar el DNI
	var patron = /^(?:\d{7,8}|\d{2}\.\d{3}\.\d{3})$/;

	// Comprobar si el DNI coincide con el patrón
	if (patron.test(dni)) {
		return true;
	} else {
		return false;
	}
}

function simulatedAPICall(dni) {
	return new Promise((resolve) => {
		if (dni === '28.757.158') {
			// Simulación de un retraso de 1 segundo antes de devolver el resultado
			setTimeout(() => {
				resolve(true); // Devuelve true
			}, 1000);
		} else {
			// Simulación de un retraso de 1 segundo antes de devolver el resultado
			setTimeout(() => {
				resolve(false); // Devuelve true
			}, 1000);
		}
	});
}

function isValidImageFormat(image) {
	const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/pdf'];
	const fileExtension = image

	return validFormats.includes(fileExtension);
}

function validarFormatoFecha(fecha) {
	const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
	if (!regex.test(fecha)) {
		return false; // El formato no coincide
	}

	const partes = fecha.split('/');
	const dia = parseInt(partes[0], 10);
	const mes = parseInt(partes[1], 10);
	const anio = parseInt(partes[2], 10);

	// Verificar si los valores son válidos
	if (isNaN(dia) || isNaN(mes) || isNaN(anio)) {
		return false; // Uno o más valores no son números
	}

	// Verificar límites de día, mes y año
	if (dia < 1 || dia > 31 || mes < 1 || mes > 12 || anio < 1000) {
		return false; // Valores fuera de rango
	}

	return true; // El formato y los valores son correctos
}

function validarLongitudMensaje(mensaje) {
	if (typeof mensaje !== 'string') {
		return false; // No es un string
	}

	if (mensaje.length > 200) {
		return false; // Supera los 200 caracteres
	}

	return true; // Es un string y cumple con la longitud
}




async function enviarSolicitudAI(userMsg) {
	const url = 'https://api.openai.com/v1/chat/completions';
	const headers = {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${OPENAI_API_KEY}`
	};
	const data = {
		model: 'gpt-3.5-turbo',
		messages: [
			{ role: "system", content: "Eres un asistente virtual llamado GBM, tu rol es guiar al usuario a través de los procesos de distintas solicitudes, asegurate de hacerlo de forma personalizada pero lo mas concisa posible." },
			{ role: 'user', content: userMsg }

		],
		temperature: 0.7
	};

	try {
		const response = await axios.post(url, data, { headers });
		console.log(response.data, response.data.choices[0].message.content);
		return response.data, response.data.choices[0].message.content
		// Aquí puedes procesar la respuesta recibida desde la API de OpenAI
	} catch (error) {
		console.error('Error al enviar la solicitud:', error.message);
	}
}

function verificarHorario() {
	const horaActual = new Date(); // Obtener la hora actual

	// Definir los límites del horario
	const horaInicio = new Date();
	horaInicio.setHours(9, 0, 0); // Hora de inicio: 09:00:00 (ejemplo)

	const horaFin = new Date();
	horaFin.setHours(18, 0, 0); // Hora de fin: 18:00:00 (ejemplo)

	// Verificar si estamos dentro del horario permitido
	if (horaActual >= horaInicio && horaActual <= horaFin) {
		return true; // Enviar a ser atendido por el bot
	} else {
		return false; // Enviar a ser atendido por una persona real
	}
}





module.exports = {
	validarDNI,
	simulatedAPICall,
	isValidImageFormat,
	validarFormatoFecha,
	validarLongitudMensaje,
	enviarSolicitudAI,
	verificarHorario
}
