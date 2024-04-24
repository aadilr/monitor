from flask import Flask, render_template, jsonify, request
import requests, os
from datetime import datetime
from time import sleep
from threading import Thread
import json

app = Flask(__name__)
API_URL = "https://www.heurist.ai/api/mining_data?address="

# A global list to keep track of the data logs
data_log = []
mining_threshold = 416000  # Default mining threshold

def fetch_data_from_api():
    while True:
        try:
            response = requests.get(API_URL)
            response.raise_for_status()
            data = response.json()
            current_count = data['data']['totalTextCount']
            timestamp = datetime.utcnow().isoformat()

            # Determine rate_change based on the previous data log entry, if available
            rate_change = (current_count - data_log[-1]['text_count']) if data_log else 0
            rate_per_minute = rate_change / 5  # Assuming 5 minutes between fetches
            hourly_rate = rate_per_minute * 60

            data_log.append({
                'timestamp': timestamp,
                'text_count': current_count,
                'rate_per_minute': rate_per_minute,
                'hourly_rate': hourly_rate,
                'good_to_mine': hourly_rate > mining_threshold
            })

        except requests.RequestException as e:
            app.logger.error(f"Error fetching data: {e}")

        sleep(300)  # Wait 5 minutes before fetching again

thread = Thread(target=fetch_data_from_api)
thread.daemon = True
thread.start()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def data():
    return jsonify(data_log)

@app.route('/threshold', methods=['POST'])
def update_threshold():
    global mining_threshold
    data = json.loads(request.data)
    mining_threshold = data.get('threshold', mining_threshold)
    return jsonify({'message': 'Threshold updated successfully!', 'new_threshold': mining_threshold})

if __name__ == '__main__':
  app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=True)
