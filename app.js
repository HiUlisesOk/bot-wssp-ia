const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');
const { validarDNI,
    simulatedAPICall,
    isValidImageFormat,
    validarFormatoFecha,
    validarLongitudMensaje,
    enviarSolicitudAI,
    verificarHorario,
    generarCodigoSeguimiento,
} = require('./utils/utils');

const { addItem } = require('./utils/notionDB')
const validator = require('validator');

function validarEmail(email) {
    return validator.isEmail(email);
}


let nombre;
let dni;
let imageUrl;
let fecha;
let message;
let code;

const flowOtro = addKeyword(['otro', 'ayuda', 'Continuar con Asistente Vitrual'])
    .addAnswer(`'🙌 Hola, bienvenido a soporte de *GBM*, por favor dime en que otro tipo de consultas puedo ayudarte:'`, { capture: true }, async (ctx, { flowDynamic }) => {
        try {

            const apiResponse = await enviarSolicitudAI(`responde con un emoji al inicio de la oración. Eres un asistente virtual de GBM y debes responder a la siguiente consulta: ${ctx.body}`);
            // El llamado a la API fue exitoso
            return flowDynamic([{
                body: `${apiResponse}`,
                buttons: [{ body: '➡️ Necesito mas ayuda' }]
            },
            ]);


        } catch (error) {
            // Ocurrió un error en el llamado a la API
            console.error('Error en el llamado a la API:', error);
            return fallBack();
        }
    })

const flowFormularioReintegros = addKeyword(['Combustible', 'Transporte Privado', 'Alojamiento', 'img'])
    .addAnswer(
        ['Hola!', 'Para enviar la solicitud de reintegro necesito unos datos...', 'Vamos a Adjuntar una foto del ticket / factura (Debe ser solo un archivo / foto)'],
        { capture: true, buttons: [{ body: '❌ Cancelar solicitud' }, { body: '➡️ Necesito ayuda' }] },

        async (ctx, { flowDynamic, endFlow, fallBack }) => {
            if (ctx.body == '❌ Cancelar solicitud')
                return endFlow({
                    body: '❌ Su solicitud ha sido cancelada ❌',    // Aquí terminamos el flow si la condicion se comple
                    buttons: [{ body: '⬅️ Volver al Inicio' }]                      // Y además, añadimos un botón por si necesitas derivarlo a otro flow
                })
            // imageUrl = await ctx?.message?.imageMessage?.mimetype || 'Not Valid Image'
            console.log(imageUrl)

            const isValidFormat = isValidImageFormat(imageUrl);

            if (isValidFormat) {
                flowDynamic('✅ El formato de la imagen es válido.')
            } else {
                flowDynamic('⛔ El formato de la imagen no es válido.')
                return fallBack()
            }
        }
    )
    .addAnswer(
        ['Ahora necesito la fecha del viaje realizado (formato dd/mm/yyyy)'],
        { capture: true, buttons: [{ body: '❌ Cancelar solicitud' }, { body: '➡️ Necesito ayuda' }] },

        async (ctx, { flowDynamic, endFlow }) => {
            if (ctx.body == '❌ Cancelar solicitud')
                return endFlow({
                    body: '❌ Su solicitud ha sido cancelada ❌',
                    buttons: [{ body: '⬅️ Volver al Inicio' }]


                })
            fecha = ctx.body
            const isValidDate = validarFormatoFecha(fecha)
            if (isValidDate) {
                flowDynamic('✅ El formato de la fecha es válido.')
            } else {
                flowDynamic('⛔ El formato de la fecha no es válido.')
                return fallBack()
            }
        }
    )
    .addAnswer(
        ['Ahora necesito que me describas brevemente el viaje realizado (menos de 200 carácteres)'],
        { capture: true, buttons: [{ body: '❌ Cancelar solicitud' }, { body: '➡️ Necesito ayuda' }] },

        async (ctx, { flowDynamic, endFlow }) => {
            if (ctx.body == '❌ Cancelar solicitud')
                return endFlow({
                    body: '❌ Su solicitud ha sido cancelada ❌',
                    buttons: [{ body: '⬅️ Volver al Inicio' }]


                })
            message = ctx.body
            const isValidMessage = validarLongitudMensaje(message)
            if (isValidMessage) {
                flowDynamic('✅ La descripción es válida.')
            } else {
                flowDynamic('⛔ La descripción no es válida.')
                return fallBack()
            }
        }
    )
    .addAnswer(
        ['¿Podrias ingresar tu email para mantenerte al tando de las novedades en tu solicitud?'],
        { capture: true, buttons: [{ body: '❌ Cancelar solicitud' }, { body: '➡️ Necesito ayuda' }] },

        async (ctx, { flowDynamic, endFlow }) => {
            if (ctx.body == '❌ Cancelar solicitud')
                return endFlow({
                    body: '❌ Su solicitud ha sido cancelada ❌',
                    buttons: [{ body: '⬅️ Volver al Inicio' }]


                })
            const email = ctx.body;
            // Aquí puedes realizar la validación del correo electrónico si es necesario
            validarEmail(email)

            if (validarEmail(email)) {
                // Generar un código de seguimiento 
                code = generarCodigoSeguimiento();

                // Enviar el código de seguimiento al correo electrónico del usuario 
                addItem(email, code);
                flowDynamic('✅ El email es válido.')
            } else {
                flowDynamic('⛔ El emai no es válido.')
                return fallBack()
            }
            return flowDynamic([{ body: '✉️ Se ha enviado un correo electrónico con el código de seguimiento. Por favor, revisa tu bandeja de entrada.' }]);
        }
    )
    .addAnswer(`Espera un momento mientras validamos tu solicitud...`, null, async (ctx, { flowDynamic, fallBack }) => {
        try {
            const apiResponse = await simulatedAPICall(dni); // Llamado simulado a la API
            if (apiResponse) {
                // El llamado a la API fue exitoso
                return flowDynamic([{
                    body: '👌 Todo Listo, tu solicitud ha sido cargada exitosamente con el número 12345! Guarda este número para consultar el estado de tu trámite. '
                }]);

            } else {
                // El llamado a la API no fue exitoso
                return flowDynamic([{
                    body: '❌ Disculpa, no veo que alguien con ese DNI trabaje en nuestro staff ¿intentamos de nuevo?',
                    buttons: [{ body: '🔙 Volver a reintegro' }, { body: '➡️ Necesito ayuda' }]
                },

                ]);

            }
        } catch (error) {
            // Ocurrió un error en el llamado a la API
            console.error('Error en el llamado a la API:', error);
            return fallBack();
        }
    })





const flowAdios = addKeyword(['ADIOS', 'adios', 'bye', 'chau', 'nos vemos']).addAnswer(['📄 Aquí tenemos el flujo secundario']);

const flowSearchDB = addKeyword(['Confirmo mi DNI'])
    .addAnswer(['🔍 Estamos verificando tu DNI en nuestra base de datos'])
    .addAnswer(['Por favor aguarda unos momentos...'])
    .addAnswer(`continuamos...`, null, async (ctx, { flowDynamic }) => {
        try {
            const apiResponse = await simulatedAPICall(dni); // Llamado simulado a la API
            if (apiResponse) {
                // El llamado a la API fue exitoso
                return flowDynamic([{
                    body: '¡El número ingresado existe!'
                }]);

            } else {
                // El llamado a la API no fue exitoso
                return flowDynamic([{
                    body: '❌ Disculpa, no veo que alguien con ese DNI trabaje en nuestro staff ¿intentamos de nuevo?',
                    buttons: [{ body: '🔙 Volver a reintegro' }, { body: '➡️ Necesito ayuda' }]
                },

                ]);

            }
        } catch (error) {
            // Ocurrió un error en el llamado a la API
            console.error('Error en el llamado a la API:', error);
            return fallBack();
        }
    })
    .addAnswer(['continuamos...'])
    .addAnswer(
        ['¿Que tipo de reintegro te gustaría presentar?'],
        { capture: true, buttons: [{ body: '⛽ Combustible' }, { body: '🚗 Transporte Privado (TAXI / Remis, Cabify, Uber, Didi)' }, { body: '🏨 Alojamiento' }, { body: '➡️ Necesito ayuda' }] },

        async (ctx, { flowDynamic, endFlow }) => {
            if (ctx.body == '⛽ Combustible') {
                return flowDynamic(`⛽ Combustible`)
            } else if (ctx.body == '🚗 Transporte Privado (TAXI / Remis, Cabify, Uber, Didi)') {
                return flowDynamic(`🚗 Transporte Privado (TAXI / Remis, Cabify, Uber, Didi)`)
            }
            else if (ctx.body == '🏨 Alojamiento') {
                return flowDynamic(`🏨 Alojamiento`)
            } else {
                return endFlow({
                    body: '❌ Su solicitud ha sido cancelada ❌',
                    buttons: [{ body: '⬅️ Volver al Inicio' }]
                })
            }
        }
    )




const flowReintegro = addKeyword(['reintegro', 'Reintegro', '123'])
    .addAnswer(
        [
            '📄 ¿Me dirías tu DNI para comenzar con el reintegro?',
            ' EJ: 28.757.158',
        ],
        { capture: true },
        (ctx, { fallBack, flowDynamic, endFlow }) => {
            if (!validarDNI(ctx.body)) {
                flowDynamic([{ body: '❌ ¡El número ingresado es incorrecto! 📄 vuelve a ingresar tus datos ' }]);
                return fallBack();
            }
            else {
                dni = ctx.body
                return flowDynamic({
                    body: '🙌 Perfecto! ¿Podrías confirmar que ingresaste bien tu DNI? Elige la opción *confirmo* para continuar o *reintegro* para volver a empezar',
                    buttons: [{ body: '✔️ Confirmo mi DNI' }, { body: '🔙 Volver a reintegro' }, { body: '➡️ Necesito ayuda' }]
                })
            }
        }, [flowSearchDB]
    )






const flowPrincipal = addKeyword(['⬅️ Volver al Inicio', 'Cancelar Solicitud', 'Asistente Vitrual'])
    .addAnswer('🙌 Hola bienvenido a soporte de *GBM*')
    .addAnswer(
        [
            'Por favor escribe alguna de las siguientes opciones para continuar',
            '👉 *reintegro* para iniciar un proceso de reintegro',
            '👉 *otro* para hacer otro tipo de consultas',
            '👉 *ayuda* en cualquier momento si no entiendes alguna parte del proceso',
            '👉 *adios* para terminar la comunicación y volver a contactarte en otro momento',
        ],
        null,
        null,
        [flowReintegro, flowOtro, flowAdios]
    )


const flowRealPeople = addKeyword(['hola', 'hello', 'buenas', 'buen dia', 'Hola'])
    .addAnswer(`'🙌 Hola, bienvenido a soporte de *GBM*'`, null, async (ctx, { flowDynamic }) => {
        try {
            const Response = verificarHorario(); // Llamado simulado a la API OPEN AI
            addItem(ctx.pushName, ctx.body, ctx.from)

            if (Response) {
                // El llamado a la API fue exitoso
                return flowDynamic([{
                    body: `⌛ Aguarda un momento, pronto serás atendido por uno de nuestros representantes.`,
                }]);

            } else {
                const apiResponse = await enviarSolicitudAI('Eres un asistente virtual y debes comunicarle a un usuario que lo atenderás hoy, debido a que no hay representantes disponibles en este momento. Responde con un emoji al inicio de la oración.');
                // El llamado a la API fue exitoso
                return flowDynamic([{
                    body: `${apiResponse}`,
                    buttons: [{ body: '➡️ Continuar con Asistente Vitrual' }]
                },
                ]);

            }
        } catch (error) {
            // Ocurrió un error en el llamado a la API
            console.error('Error en el llamado a la API:', error);

        }
    })




const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([flowPrincipal, flowRealPeople, flowReintegro, flowSearchDB, flowFormularioReintegros, flowOtro,]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
};

main();
