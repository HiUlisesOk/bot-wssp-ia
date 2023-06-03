const { Configuration, OpenAIApi } = require("openai");
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ORGANIZATION_ID = process.env.ORGANIZATION_ID;

if (!OPENAI_API_KEY) {
	console.error("La clave de la API de OpenAI no está configurada.");
	process.exit(1);
}

if (!ORGANIZATION_ID) {
	console.error("El ID de la organización no está configurado.");
	process.exit(1);
}

const configuration = new Configuration({
	organization: ORGANIZATION_ID,
	apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function validarDNI(dni) {
	try {
		if (typeof dni !== 'string') {
			return false; // El DNI no es una cadena de texto
		}

		dni = dni.trim(); // Eliminar espacios en blanco al principio y al final

		if (dni.length === 0) {
			return false; // El DNI está vacío
		}

		// Expresión regular para validar el DNI
		const patron = /^(?:\d{7,8}|\d{2}[\.-]?\d{3}[\.-]?\d{3})$/;

		// Comprobar si el DNI coincide con el patrón
		return patron.test(dni);
	} catch (error) {
		console.error('Error al validar el DNI:', error);
		return false;
	}
}

async function simulatedAPICall(dni) {
	try {
		// Simulación de una llamada a una API con un retraso de 1 segundo
		await new Promise(resolve => setTimeout(resolve, 1000));

		if (dni === '28.757.158') {
			return true; // DNI válido
		} else {
			return false; // DNI inválido
		}
	} catch (error) {
		console.error('Error en la simulación de la llamada a la API:', error);
		return false;
	}
}

function isValidImageFormat(image) {
	const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/pdf'];

	if (!image || typeof image !== 'string') {
		return false; // El valor de la imagen no es válido
	}

	const fileExtension = image.toLowerCase().split('.').pop();

	return validFormats.includes(`image/${fileExtension}`);
}

function validarFormatoFecha(fecha) {
	const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

	if (!fecha || typeof fecha !== 'string') {
		return false; // El valor de la fecha no es válido
	}

	if (!regex.test(fecha)) {
		return false; // El formato de fecha no coincide
	}

	const partes = fecha.split('/');
	const dia = parseInt(partes[0], 10);
	const mes = parseInt(partes[1], 10);
	const anio = parseInt(partes[2], 10);

	if (isNaN(dia) || isNaN(mes) || isNaN(anio)) {
		return false; // Uno o más valores no son números
	}

	if (dia < 1 || dia > 31 || mes < 1 || mes > 12 || anio < 1000) {
		return false; // Valores fuera de rango
	}

	return true; // El formato y los valores son correctos
}

function validarLongitudMensaje(mensaje) {
	if (typeof mensaje !== 'string') {
		return false; // No es una cadena de texto
	}

	if (mensaje.trim().length > 200) {
		return false; // Supera los 200 caracteres (contando sin espacios en blanco al principio y al final)
	}

	return true; // Es una cadena de texto y cumple con la longitud
}

async function enviarSolicitudAI(userMsg) {
	try {
		if (typeof userMsg !== 'string') {
			console.error("El mensaje del usuario no es una cadena de texto.");
			return null;
		}

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

		const response = await axios.post(url, data, { headers });
		const completion = response.data.choices[0].message.content;

		return completion;
	} catch (error) {
		console.error('Error al enviar la solicitud a la API de OpenAI:', error.message);
		return null;
	}
}

function verificarHorario() {
	const horaActual = new Date();
	const horaInicio = new Date();
	const horaFin = new Date();

	horaInicio.setHours(9, 0, 0); // Hora de inicio: 09:00:00
	horaFin.setHours(18, 0, 0); // Hora de fin: 18:00:00

	return horaActual >= horaInicio && horaActual <= horaFin;
}

module.exports = {
	validarDNI,
	simulatedAPICall,
	isValidImageFormat,
	validarFormatoFecha,
	validarLongitudMensaje,
	enviarSolicitudAI,
	verificarHorario
};
