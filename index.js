require('dotenv').config();
const {Bot, Keyboard, InlineKeyboard, GrammyError, HttpError} = require('grammy');
const {getRandomQuestion, getCorrectAnswer} = require('./utils')
const bot = new Bot(process.env.BOT_API_KEY);

bot.command('start', async (ctx) => {
    const startKeyboard = new Keyboard()
        .text('HTML')
        .text('CSS')
        .row()
        .text('JavaScript')
        .text('React')
        .row()
        .text('Случайный вопрос')
        .resized();

    await ctx.reply('Привет! Я - Frontend Interview Bot \nПомогу тебе подготовиться к собеседованию');//чтобы отправить сообщение пользователю в ответ
     await ctx.reply('С чего начнем? Выбери тему вопроса в меню 👇', {
        reply_markup: startKeyboard
     })
}); //для добавления комманд(старт, энд и тд)

bot.hears(['HTML', 'CSS', 'JavaScript', 'React', 'Случайный вопрос'], async (ctx) => {
    const topic = ctx.message.text.toLowerCase();
    const {question, questionTopic} = getRandomQuestion(topic);
    let inlineKeyboard;

    if (question.hasOptions) {
      const buttonRows = question.options.map((option) => {
        return [InlineKeyboard.text(option.text, JSON.stringify({
          type: `${questionTopic}-option`,
          isCorrect: option.isCorrect,
          questionId: question.id,
        }))]
      });

      inlineKeyboard = InlineKeyboard.from(buttonRows);
    } else {
       inlineKeyboard = new InlineKeyboard()
        .text('Узнать ответ', JSON.stringify({
            type: questionTopic,
            questionId: question.id,
        }),
        );
    }
      
     await ctx.reply(question.text, {
        reply_markup: inlineKeyboard
     })
});

//Создадим функционал по нажатию на Получить ответ или cancel
bot.on('callback_query:data', async (ctx) => {
    const callBackData = JSON.parse(ctx.callbackQuery.data);

    if (!callBackData.type.includes('option')) {
      await ctx.reply(
        getCorrectAnswer(callBackData.type, callBackData.questionId), {
        parse_mode: 'HTML', 
        disable_web_page_preview: true,
      }); //отвечаем пользователю найденным ответом
      await ctx.answerCallbackQuery();
      return;
    }

    if (callBackData.isCorrect) {
      await ctx.reply('Верно ✅');
      await ctx.answerCallbackQuery();
      return;
    }

    // const answer = getCorrectAnswer(callBackData.type.split('-')[0], callBackData.questionId);
    await ctx.reply(`Неверно ❌ Правильный ответ: ${getCorrectAnswer(
      callBackData.type.split('-')[0],
      callBackData.questionId,
    )}`);
    await ctx.answerCallbackQuery();
})


bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });

bot.start();
