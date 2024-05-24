from flask import Flask, request, jsonify
import pyttsx3
from playsound import playsound
import time

SPEECH_FILE_NAME = "generated_speech"
SPEECH_FILE_TYPE = ".wav"
TEXT = "Pepper reported a new event: {topic}. Please check the location at {location}."
ALARM_SOUND_FILE = "./assets/system_notification.wav"

app = Flask(__name__)

engine = pyttsx3.init()
engine.setProperty("rate", 140)
engine.setProperty("voice", "english")

@app.route("/report-event", methods=["POST"])
def alert_police():
    # Create a file for the timestamp to log all reports of Pepper.
    ts = time.time()
    file_name = SPEECH_FILE_NAME + str(ts) + SPEECH_FILE_TYPE

    params = request.args

    # Since engine.say results in runAndWait being stuck a file output has to be used.
    engine.save_to_file(TEXT.format(topic = params["topic"], location=params["location"]), file_name)
    engine.runAndWait()

    playsound(ALARM_SOUND_FILE)
    playsound("./" + file_name)

    return jsonify({
    });

if __name__ == "__main__":
    app.run(debug = True, host="0.0.0.0", port=5730)
