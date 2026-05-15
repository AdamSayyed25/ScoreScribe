document.addEventListener('DOMContentLoaded', () => {

    const homeCity = document.getElementById('home-city');
    const homeName = document.getElementById('home-name');
    const homeScores = document.getElementById('home-scores');
    const homeScorePreview = document.getElementById('home-score-preview');
    const homePerformers = document.getElementById('home-performers');
    const btnAddHomePerformer = document.getElementById('btn-add-home-performer');
    const homeAssists = document.getElementById('home-assists');
    const homeRebounds = document.getElementById('home-rebounds');
    const homeTurnovers = document.getElementById('home-turnovers');

    const awayCity = document.getElementById('away-city');
    const awayName = document.getElementById('away-name');
    const awayScores = document.getElementById('away-scores');
    const awayScorePreview = document.getElementById('away-score-preview');
    const awayPerformers = document.getElementById('away-performers');
    const btnAddAwayPerformer = document.getElementById('btn-add-away-performer');
    const awayAssists = document.getElementById('away-assists');
    const awayRebounds = document.getElementById('away-rebounds');
    const awayTurnovers = document.getElementById('away-turnovers');

    const btnGenerate = document.getElementById('btn-generate');
    const outputEmpty = document.getElementById('output-empty');
    const outputContent = document.getElementById('output-content');
    const recapText = document.getElementById('recap-text');
    const btnCopy = document.getElementById('btn-copy');
    const errorDisplay = document.getElementById('error-display');
    const errorText = document.getElementById('error-text');

    const sbHomeCity = document.getElementById('scoreboard-home-city');
    const sbHomeName = document.getElementById('scoreboard-home-name');
    const sbHomePts = document.getElementById('scoreboard-home-pts');
    const sbAwayCity = document.getElementById('scoreboard-away-city');
    const sbAwayName = document.getElementById('scoreboard-away-name');
    const sbAwayPts = document.getElementById('scoreboard-away-pts');

    function parseScores(input) {
        if (!input.trim()) return [];
        return input.split(',').map(s => s.trim()).filter(s => s !== '' && !isNaN(s));
    }

    function renderScorePreview(container, scores) {
        container.innerHTML = '';
        if (scores.length === 0) return;

        const labels = ['FIN'];
        for (let i = 1; i < scores.length; i++) {
            if (i <= 4) {
                labels.push('Q' + i);
            } else {
                labels.push('OT' + (i - 4));
            }
        }

        scores.forEach((score, idx) => {
            const badge = document.createElement('span');
            if (idx === 0) {
                badge.className = 'score-badge final';
            } else {
                badge.className = 'score-badge quarter';
            }
            const labelSpan = document.createElement('span');
            labelSpan.className = 'score-badge-label';
            labelSpan.textContent = labels[idx] || ('P' + idx);
            badge.appendChild(labelSpan);
            badge.appendChild(document.createTextNode(score));
            container.appendChild(badge);
        });
    }

    homeScores.addEventListener('input', () => {
        renderScorePreview(homeScorePreview, parseScores(homeScores.value));
    });

    awayScores.addEventListener('input', () => {
        renderScorePreview(awayScorePreview, parseScores(awayScores.value));
    });

    function createPerformerRow(team) {
        const row = document.createElement('div');
        row.className = 'performer-row';
        row.innerHTML = `
            <input type="text" class="field-input performer-input" placeholder="e.g. Player Name, PTS, REB, AST, STL, BLK" data-team="${team}" autocomplete="off">
            <button class="btn-remove-performer" title="Remove" aria-label="Remove performer">×</button>
        `;
        row.querySelector('.btn-remove-performer').addEventListener('click', () => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(-12px)';
            setTimeout(() => row.remove(), 200);
        });
        return row;
    }

    btnAddHomePerformer.addEventListener('click', () => {
        homePerformers.appendChild(createPerformerRow('home'));
    });

    btnAddAwayPerformer.addEventListener('click', () => {
        awayPerformers.appendChild(createPerformerRow('away'));
    });

    document.querySelectorAll('.btn-remove-performer').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('.performer-row');
            row.style.opacity = '0';
            row.style.transform = 'translateX(-12px)';
            setTimeout(() => row.remove(), 200);
        });
    });

    function parsePerformer(inputStr) {
        const parts = inputStr.split(',').map(p => p.trim());
        if (parts.length < 2) return null;
        return {
            name: parts[0],
            pts: parseInt(parts[1]) || 0,
            reb: parseInt(parts[2]) || 0,
            ast: parseInt(parts[3]) || 0,
            stl: parseInt(parts[4]) || 0,
            blk: parseInt(parts[5]) || 0
        };
    }

    function getPerformers(container) {
        const inputs = container.querySelectorAll('.performer-input');
        const performers = [];
        inputs.forEach(inp => {
            if (inp.value.trim()) {
                const p = parsePerformer(inp.value);
                if (p) performers.push(p);
            }
        });
        return performers;
    }

    function buildPayload() {
        const hScores = parseScores(homeScores.value);
        const aScores = parseScores(awayScores.value);

        return {
            home_city: homeCity.value.trim(),
            home_name: homeName.value.trim(),
            home_score: parseInt(hScores[0]) || 0,
            home_assists: parseInt(homeAssists.value) || 0,
            home_rebounds: parseInt(homeRebounds.value) || 0,
            home_turnovers: parseInt(homeTurnovers.value) || 0,
            away_city: awayCity.value.trim(),
            away_name: awayName.value.trim(),
            away_score: parseInt(aScores[0]) || 0,
            away_assists: parseInt(awayAssists.value) || 0,
            away_rebounds: parseInt(awayRebounds.value) || 0,
            away_turnovers: parseInt(awayTurnovers.value) || 0,
            home_performers: getPerformers(homePerformers),
            away_performers: getPerformers(awayPerformers)
        };
    }

    function shakeButton(btn) {
        btn.style.animation = 'shake 0.4s ease';
        setTimeout(() => btn.style.animation = '', 400);
    }

    function animateScore(el, target) {
        let current = 0;
        const step = Math.max(1, Math.floor(target / 30));
        const interval = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            el.textContent = current;
        }, 25);
    }

    function showError(message) {
        outputEmpty.style.display = 'none';
        outputContent.style.display = 'block';
        errorDisplay.style.display = 'block';
        errorText.textContent = message;
        recapText.innerHTML = '';
        document.getElementById('scoreboard').style.display = 'none';
        btnCopy.style.display = 'none';
    }

    function hideError() {
        errorDisplay.style.display = 'none';
        document.getElementById('scoreboard').style.display = 'flex';
    }

    btnGenerate.addEventListener('click', async () => {
        const payload = buildPayload();

        if (!payload.home_city || !payload.home_name || !payload.away_city || !payload.away_name) {
            shakeButton(btnGenerate);
            return;
        }
        if (payload.home_score === 0 && payload.away_score === 0) {
            shakeButton(btnGenerate);
            return;
        }

        btnGenerate.classList.add('loading');
        hideError();

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || ('Server error: ' + response.status));
            }

            const data = await response.json();

            sbHomeCity.textContent = payload.home_city.toUpperCase();
            sbHomeName.textContent = payload.home_name;
            sbHomePts.textContent = payload.home_score;
            sbAwayCity.textContent = payload.away_city.toUpperCase();
            sbAwayName.textContent = payload.away_name;
            sbAwayPts.textContent = payload.away_score;

            recapText.innerHTML = '<p>' + data.summary + '</p>';

            outputEmpty.style.display = 'none';
            outputContent.style.display = 'block';
            btnCopy.style.display = 'flex';

            animateScore(sbHomePts, payload.home_score);
            animateScore(sbAwayPts, payload.away_score);

        } catch (err) {
            showError('Failed to generate recap: ' + err.message);
        } finally {
            btnGenerate.classList.remove('loading');
        }
    });

    btnCopy.addEventListener('click', async () => {
        const text = recapText.innerText;
        try {
            await navigator.clipboard.writeText(text);
            btnCopy.classList.add('copied');
            btnCopy.querySelector('.copy-label').textContent = 'Copied!';
            setTimeout(() => {
                btnCopy.classList.remove('copied');
                btnCopy.querySelector('.copy-label').textContent = 'Copy';
            }, 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    });

    document.querySelector('.logo-group').addEventListener('dblclick', async () => {
        const logoIcon = document.querySelector('.logo-icon');
        logoIcon.style.animation = 'none';
        logoIcon.offsetHeight;
        logoIcon.style.animation = 'logoPulse 0.3s ease 3';

        try {
            const response = await fetch('/random-game');
            if (!response.ok) throw new Error('Failed to fetch random game');
            const game = await response.json();

            homeCity.value = game.home_city || '';
            homeName.value = game.home_name || '';
            homeScores.value = game.home_scores || '';
            homeAssists.value = game.home_assists || 0;
            homeRebounds.value = game.home_rebounds || 0;
            homeTurnovers.value = game.home_turnovers || 0;
            renderScorePreview(homeScorePreview, parseScores(homeScores.value));

            homePerformers.innerHTML = '';
            if (game.home_performers) {
                game.home_performers.forEach(p => {
                    const row = createPerformerRow('home');
                    row.querySelector('input').value = `${p.name}, ${p.pts}, ${p.reb}, ${p.ast}, ${p.stl}, ${p.blk}`;
                    homePerformers.appendChild(row);
                });
            }

            awayCity.value = game.away_city || '';
            awayName.value = game.away_name || '';
            awayScores.value = game.away_scores || '';
            awayAssists.value = game.away_assists || 0;
            awayRebounds.value = game.away_rebounds || 0;
            awayTurnovers.value = game.away_turnovers || 0;
            renderScorePreview(awayScorePreview, parseScores(awayScores.value));

            awayPerformers.innerHTML = '';
            if (game.away_performers) {
                game.away_performers.forEach(p => {
                    const row = createPerformerRow('away');
                    row.querySelector('input').value = `${p.name}, ${p.pts}, ${p.reb}, ${p.ast}, ${p.stl}, ${p.blk}`;
                    awayPerformers.appendChild(row);
                });
            }

        } catch (err) {
            console.error('Failed to load random game:', err);
        }
    });

});

const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
}
`;
document.head.appendChild(shakeStyle);
