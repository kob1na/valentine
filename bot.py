import os, hmac, hashlib, urllib.parse
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, F
from aiogram.types import Message
from aiogram.filters import CommandStart
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.context import FSMContext

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8001")
SIGNING_SECRET = os.getenv("SIGNING_SECRET", "change_me")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

class Form(StatesGroup):
    name = State()
    text = State()

def sign_params(params: dict) -> str:
    # сортируем, чтобы подпись была стабильной
    payload = "&".join(f"{k}={params[k]}" for k in sorted(params.keys()))
    sig = hmac.new(SIGNING_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()[:16]
    return sig

def build_link(name: str, text: str) -> str:
    params = {
        "name": name.strip(),
        "text": text.strip(),
    }
    # URL-encode для безопасной передачи
    encoded = {k: urllib.parse.quote(v, safe="") for k, v in params.items()}
    sig = sign_params(encoded)
    encoded["sig"] = sig
    qs = "&".join(f"{k}={v}" for k, v in encoded.items())
    return f"{BASE_URL}/?{qs}"

@dp.message(CommandStart())
async def start(m: Message, state: FSMContext):
    await state.clear()
    await m.answer("💘 Сделаем валентинку!\n\nКак зовут получателя? (например: Аня)")
    await state.set_state(Form.name)

@dp.message(Form.name)
async def got_name(m: Message, state: FSMContext):
    name = (m.text or "").strip()
    if len(name) < 1 or len(name) > 40:
        await m.answer("Имя должно быть от 1 до 40 символов. Попробуй ещё раз 🙂")
        return
    await state.update_data(name=name)
    await m.answer("Напиши короткое сообщение (или отправь '-' чтобы оставить стандартное):")
    await state.set_state(Form.text)

@dp.message(Form.text)
async def got_text(m: Message, state: FSMContext):
    data = await state.get_data()
    name = data["name"]
    text = (m.text or "").strip()
    if text == "-" or text == "":
        text = "Ты делаешь мой мир ярче. Спасибо, что ты есть ❤️"
    if len(text) > 200:
        await m.answer("Сообщение слишком длинное (до 200 символов). Напиши короче 🙂")
        return

    link = build_link(name, text)
    await state.clear()

    await m.answer(
        "✨ Готово!\n"
        "Отправь эту ссылку человеку:\n\n"
        f"{link}\n\n"
        "Хочешь — сделаем ещё вариант (другая тема/цвет/музыка). Напиши /start"
    )

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
