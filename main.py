from flask import Flask, jsonify, render_template
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    with open('data.json') as f:
        data = json.load(f)
    return jsonify(data)

def run():
    app.run(host="0.0.0.0", port=5000)

if __name__ == '__main__':
    import multiprocessing, updateRate
    p1 = multiprocessing.Process(target=updateRate.main)
    p2 = multiprocessing.Process(target=run)
    p1.start()
    p2.start()
    p1.join()
    p2.join()
    
