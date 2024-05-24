import pyaudio
import speech_recognition as sr
import logging
from flask import Flask, Response, jsonify
from http import HTTPStatus

RECORD_SECONDS = 3 # record duration
PYAUDIO_FORMAT = pyaudio.paInt16  # Resolution: 16-bit
CHUNK = 1024  # 2^10 buffer samples
CHANNELS = 1
SAMPLING_RATE = 44100

app = Flask(__name__)
logging.basicConfig(level=1)
logger = logging.getLogger(__name__)

class CONSOLE_COLOR():
    OK = '\033[92m'
    WARNING = '\033[93m'
    ERROR = '\033[91m'

@app.route("/record-audio", methods=["POST"])
def speech_recognition():
    # Initialize PyAudioscore
    audio = pyaudio.PyAudio()

    # Initialize speech recognition
    recognizer = sr.Recognizer()

    stream = audio.open(format=PYAUDIO_FORMAT, channels=CHANNELS,
                        rate=SAMPLING_RATE, input=True,
                        frames_per_buffer=CHUNK)

    logger.info("Beginning to record ...")

    frames = []

    try:
        # Data recording
        for _ in range(0, int(SAMPLING_RATE / CHUNK * RECORD_SECONDS)):
            data = stream.read(CHUNK)
            frames.append(data)

        logger.info("Recording finished, processing now ...")

        stream.stop_stream()
        stream.close()
        audio.terminate()

        # Create byte data out of frames
        audio_data = b''.join(frames)

        source = sr.AudioData(audio_data, SAMPLING_RATE, 2)

        try:
            recognizedText = recognizer.recognize_google(source)
            logger.info(CONSOLE_COLOR.OK + f"Spoken text: {recognizedText}")

            return jsonify({
                "recognizedText": recognizedText
            })
        except sr.UnknownValueError:
            logger.warn(CONSOLE_COLOR.ERROR + f"[Error] Speech could not be recognized")
            return jsonify({
                "recognizedText": ""
            })
        except sr.RequestError as e:
            logger.error(CONSOLE_COLOR.ERROR + f"[Error] RequestError: {e}")
            return Response(status=HTTPStatus.INTERNAL_SERVER_ERROR)

    except KeyboardInterrupt:
        logger.warn(CONSOLE_COLOR.WARNING + f"The speech recognition was manually interrupted by Keyboard Interrupt")
        stream.stop_stream()
        stream.close()
        audio.terminate()

if __name__ == "__main__":
    app.run(debug = True, host="0.0.0.0", port=5720)
