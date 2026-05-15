# ScoreScribe AI-Powered Game Narratives

ScoreScribe is an end-to-end web application that transforms structured basketball box-score statistics into professional game recap narratives using a fine-tuned BART transformer model.

Users input game data such as team names, scores, quarter breakdowns, and top player stats and the system generates a coherent written summary in real time.

---

## System Architecture

```
Frontend (HTML/CSS/JS)

FastAPI Backend

Fine-Tuned BART Model

Generated Game Recap
```
 

## Project Structure

```
ScoreScribe/
│
├── frontend/                  
│   ├── index.html             
│   ├── styles.css             
│   └── script.js             
│
├── backend/
│   ├── app.py                 
│   ├── inference.py           
│   └── linearizer.py          
│
├── final_best_model/          
│   ├── model.safetensors     
│   ├── config.json          
│   ├── vocab.json            
│   ├── merges.txt           
│   ├── tokenizer_config.json 
│   └── generation_config.json 
│
├── requirements.txt          
└── README.md                 
```


## Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AdamSayyed25/ScoreScribe.git
cd ScoreScribe
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `fastapi`
- `uvicorn[standard]` 
- `torch`
- `transformers`
- `safetensors`
- `pydantic`
- `datasets` 

### Download the Fine-tuned model:
https://drive.google.com/drive/folders/1RhojRqqqeGwMEqsoz3UM6aFUsUOwbfuw?usp=sharing

## Place the extracted final_best_model into the repo 
<img width="382" height="488" alt="image" src="https://github.com/user-attachments/assets/f817944d-8189-4b36-8c2e-54a31e5daeef" />

## Running the Demo

### Start the Server

```bash
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

On startup, the server will:
1. Load the fine-tuned BART model into memory 
2. Load the RotoWire dataset for the random game feature
3. Begin serving the frontend at `http://localhost:8000`

### Open the Application

Navigate to **http://localhost:8000** in your browser.

---

## How to Use

### Manual Input
1. Fill in Home Team and Away Team sections (city, name, scores, assists, rebounds, turnovers)
2. Add top performer stats for each team (Name, PTS, REB, AST, STL, BLK)
3. Click Generate Recap
4. The AI-generated game summary appears in the right panel

### Random Game (from Dataset)
- Double-click the ScoreScribe logo to instantly load a random real NBA game from the RotoWire dataset into the form
- Then click Generate Recap to see the model's summary

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serves the frontend UI |
| `POST` | `/generate` | Accepts game JSON, returns AI-generated summary |
| `GET` | `/random-game` | Returns a random game from the RotoWire dataset |

### Example Request



### Example Response

```json
{
  "summary": "The Boston Celtics defeated the Sacramento Kings 114-97 on Wednesday...",
  "linearized_input": "[DATE] 05_14_26 [HOME_TEAM] Sacramento Kings scored 97 points..."
}
```

---


