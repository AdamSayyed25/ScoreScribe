document.addEventListener('DOMContentLoaded', () => {

    const sportChips = document.querySelectorAll('.sport-chip');
    const homeCity = document.getElementById('home-city');
    const homeName = document.getElementById('home-name');
    const homeScores = document.getElementById('home-scores');
    const homeScorePreview = document.getElementById('home-score-preview');
    const homePerformers = document.getElementById('home-performers');
    const btnAddHomePerformer = document.getElementById('btn-add-home-performer');

    const awayCity = document.getElementById('away-city');
    const awayName = document.getElementById('away-name');
    const awayScores = document.getElementById('away-scores');
    const awayScorePreview = document.getElementById('away-score-preview');
    const awayPerformers = document.getElementById('away-performers');
    const btnAddAwayPerformer = document.getElementById('btn-add-away-performer');

    const btnGenerate = document.getElementById('btn-generate');
    const outputEmpty = document.getElementById('output-empty');
    const outputContent = document.getElementById('output-content');
    const recapText = document.getElementById('recap-text');
    const btnCopy = document.getElementById('btn-copy');

    const sbHomeCity = document.getElementById('scoreboard-home-city');
    const sbHomeName = document.getElementById('scoreboard-home-name');
    const sbHomePts = document.getElementById('scoreboard-home-pts');
    const sbAwayCity = document.getElementById('scoreboard-away-city');
    const sbAwayName = document.getElementById('scoreboard-away-name');
    const sbAwayPts = document.getElementById('scoreboard-away-pts');

    sportChips.forEach(chip => {
        chip.addEventListener('click', () => {
            sportChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });

    function parseScores(input) {
        if (!input.trim()) return [];
        return input.split(',').map(s => s.trim()).filter(s => s !== '' && !isNaN(s));
    }

    function renderScorePreview(container, scores) {
        container.innerHTML = '';
        if (scores.length === 0) return;

        const labels = ['FIN'];
        const activeChip = document.querySelector('.sport-chip.active');
        let sport = 'basketball';
        if (activeChip && activeChip.dataset.sport) {
            sport = activeChip.dataset.sport;
        }

        if (sport === 'basketball') {
            for (let i = 1; i < scores.length; i++) {
                if (i <= 4) {
                    labels.push(`Q${i}`);
                } else {
                    labels.push(`OT${i - 4}`);
                }
            }
        } else if (sport === 'football') {
            for (let i = 1; i < scores.length; i++) {
                if (i <= 4) {
                    labels.push(`Q${i}`);
                } else {
                    labels.push(`OT${i - 4}`);
                }
            }
        } else if (sport === 'baseball') {
            for (let i = 1; i < scores.length; i++) labels.push(`${i}`);
        } else if (sport === 'soccer') {
            for (let i = 1; i < scores.length; i++) {
                if (i <= 2) {
                    labels.push(`H${i}`);
                } else {
                    labels.push(`ET${i - 2}`);
                }
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
            labelSpan.textContent = labels[idx] || `P${idx}`;
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
            <input type="text" class="field-input performer-input" placeholder="e.g. Player Name, PTS, REB, AST" data-team="${team}" autocomplete="off">
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
            ast: parseInt(parts[3]) || 0
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

    function getGameData() {
        const activeChipEl = document.querySelector('.sport-chip.active');
        let sport = 'basketball';
        if (activeChipEl && activeChipEl.dataset.sport) {
            sport = activeChipEl.dataset.sport;
        }
        const hScores = parseScores(homeScores.value);
        const aScores = parseScores(awayScores.value);

        return {
            sport,
            home: {
                city: homeCity.value.trim(),
                name: homeName.value.trim(),
                finalScore: parseInt(hScores[0]) || 0,
                quarters: hScores.slice(1).map(Number),
                performers: getPerformers(homePerformers)
            },
            away: {
                city: awayCity.value.trim(),
                name: awayName.value.trim(),
                finalScore: parseInt(aScores[0]) || 0,
                quarters: aScores.slice(1).map(Number),
                performers: getPerformers(awayPerformers)
            }
        };
    }

    function determineWinner(data) {
        if (data.home.finalScore > data.away.finalScore) return 'home';
        if (data.away.finalScore > data.home.finalScore) return 'away';
        return 'tie';
    }

    function hasOvertime(data) {
        if (data.sport === 'basketball' || data.sport === 'football') {
            return data.home.quarters.length > 4;
        }
        return false;
    }

    function getTopPerformerPhrase(p, sport) {
        if (sport === 'baseball') {
            return `${p.pts} hits, ${p.reb} RBIs, and ${p.ast} runs`;
        } else if (sport === 'soccer') {
            let goalSuffix = '';
            if (p.pts !== 1) {
                goalSuffix = 's';
            }
            let assistSuffix = '';
            if (p.ast !== 1) {
                assistSuffix = 's';
            }
            return `${p.pts} goal${goalSuffix} and ${p.ast} assist${assistSuffix}`;
        }
        return `${p.pts} points, ${p.reb} rebounds, and ${p.ast} assists`;
    }

    function generateNarrative(data) {
        const winner = determineWinner(data);
        const overtime = hasOvertime(data);
        let winTeam;
        let loseTeam;
        if (winner === 'home') {
            winTeam = data.home;
            loseTeam = data.away;
        } else {
            winTeam = data.away;
            loseTeam = data.home;
        }
        const sport = data.sport;

        const paragraphs = [];

        if (winner === 'tie') {
            paragraphs.push(
                `<span class="section-label">Game Summary</span>` +
                `The <span class="team-mention">${data.home.city} ${data.home.name}</span> ` +
                `and the <span class="team-mention">${data.away.city} ${data.away.name}</span> ` +
                `battled to a <span class="stat-highlight">${data.home.finalScore}-${data.away.finalScore}</span> draw ` +
                `in a closely contested matchup` +
                (function() {
                    if (overtime) return ' that required overtime.';
                    return '.';
                })()
            );
        } else {
            const margin = Math.abs(data.home.finalScore - data.away.finalScore);
            const closeGame = margin <= 5;
            const blowout = margin >= 20;

            let verb = 'beat';
            if (closeGame) {
                if (overtime) {
                    verb = 'edged';
                } else {
                    verb = 'narrowly defeated';
                }
            }
            else if (blowout) verb = 'dominated';
            else verb = 'defeated';

            paragraphs.push(
                `<span class="section-label">Game Summary</span>` +
                `The <span class="team-mention">${winTeam.city} ${winTeam.name}</span> ` +
                `${verb} the <span class="team-mention">${loseTeam.city} ${loseTeam.name}</span> ` +
                `<span class="stat-highlight">${winTeam.finalScore}-${loseTeam.finalScore}</span>` +
                (function() {
                    let suffix = '';
                    if (overtime) suffix += ' in overtime';
                    if (closeGame) suffix += ' in a thriller that came down to the wire.';
                    else if (blowout) suffix += ' in a lopsided contest that was never truly in doubt.';
                    else suffix += '.';
                    return suffix;
                })()
            );
        }

        if (winTeam.performers.length > 0 || (winner === 'tie' && data.home.performers.length > 0)) {
            let team;
            if (winner === 'tie') {
                team = data.home;
            } else {
                team = winTeam;
            }
            const teamLabel = team.city;
            let performerText = `<span class="section-label">${teamLabel.toUpperCase()}</span>`;

            team.performers.forEach((p, idx) => {
                const stats = getTopPerformerPhrase(p, sport);
                if (idx === 0) {
                    performerText += `<span class="player-name">${p.name}</span> led the way with <span class="stat-highlight">${stats}</span>`;
                } else {
                    performerText += `. <span class="player-name">${p.name}</span> contributed <span class="stat-highlight">${stats}</span>`;
                }
            });

            if (winner !== 'tie') {
                performerText += `, helping the ${winTeam.name} secure the victory.`;
            } else {
                performerText += `.`;
            }

            paragraphs.push(performerText);
        }

        let otherTeam;
        if (winner === 'tie') {
            otherTeam = data.away;
        } else {
            otherTeam = loseTeam;
        }
        if (otherTeam.performers.length > 0) {
            let loseText = `<span class="section-label">${otherTeam.city.toUpperCase()}</span>`;

            otherTeam.performers.forEach((p, idx) => {
                const stats = getTopPerformerPhrase(p, sport);
                if (idx === 0) {
                    loseText += `<span class="player-name">${p.name}</span> finished with <span class="stat-highlight">${stats}</span> for the ${otherTeam.name}`;
                } else {
                    loseText += `. <span class="player-name">${p.name}</span> added <span class="stat-highlight">${stats}</span>`;
                }
            });

            loseText += `.`;
            paragraphs.push(loseText);
        }

        if (data.home.quarters.length > 0 && data.away.quarters.length > 0) {
            const numPeriods = Math.min(data.home.quarters.length, data.away.quarters.length);
            let flowText = `<span class="section-label">Game Flow</span>`;

            let bigDiffIdx = 0;
            let bigDiff = 0;
            for (let i = 0; i < numPeriods; i++) {
                const diff = Math.abs(data.home.quarters[i] - data.away.quarters[i]);
                if (diff > bigDiff) {
                    bigDiff = diff;
                    bigDiffIdx = i;
                }
            }

            let periodLabel = 'quarter';
            if (sport === 'baseball') {
                periodLabel = 'inning';
            } else if (sport === 'soccer') {
                periodLabel = 'half';
            }
            const bigQHome = data.home.quarters[bigDiffIdx];
            const bigQAway = data.away.quarters[bigDiffIdx];
            let bigQWinner;
            if (bigQHome > bigQAway) {
                bigQWinner = data.home;
            } else {
                bigQWinner = data.away;
            }

            if (bigDiff > 0) {
                flowText += `The pivotal ${periodLabel} was the ${ordinal(bigDiffIdx + 1)}, where the ` +
                    `<span class="team-mention">${bigQWinner.name}</span> outscored their opponents ` +
                    `<span class="stat-highlight">${Math.max(bigQHome, bigQAway)}-${Math.min(bigQHome, bigQAway)}</span>` +
                    (function() {
                        if (bigDiffIdx + 1 > 4) return ' in overtime.';
                        return '.';
                    })();
            }

            paragraphs.push(flowText);
        }

        return paragraphs;
    }

    function ordinal(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    btnGenerate.addEventListener('click', () => {
        const data = getGameData();

        if (!data.home.city || !data.home.name || !data.away.city || !data.away.name) {
            shakeButton(btnGenerate);
            return;
        }
        if (data.home.finalScore === 0 && data.away.finalScore === 0) {
            shakeButton(btnGenerate);
            return;
        }

        btnGenerate.classList.add('loading');

        setTimeout(() => {
            sbHomeCity.textContent = data.home.city.toUpperCase();
            sbHomeName.textContent = data.home.name;
            sbHomePts.textContent = data.home.finalScore;
            sbAwayCity.textContent = data.away.city.toUpperCase();
            sbAwayName.textContent = data.away.name;
            sbAwayPts.textContent = data.away.finalScore;

            const paragraphs = generateNarrative(data);
            recapText.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');

            outputEmpty.style.display = 'none';
            outputContent.style.display = 'block';
            btnCopy.style.display = 'flex';

            animateScore(sbHomePts, data.home.finalScore);
            animateScore(sbAwayPts, data.away.finalScore);

            btnGenerate.classList.remove('loading');
        }, 1200);
    });

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

    document.querySelector('.logo-group').addEventListener('dblclick', () => {
        homeCity.value = 'Denver';
        homeName.value = 'Nuggets';
        homeScores.value = '136, 30, 25, 37, 32, 12';
        renderScorePreview(homeScorePreview, parseScores(homeScores.value));

        homePerformers.innerHTML = '';
        const hp1 = createPerformerRow('home');
        hp1.querySelector('input').value = 'Nikola Jokic, 40, 8, 13';
        const hp2 = createPerformerRow('home');
        hp2.querySelector('input').value = 'Jamal Murray, 25, 4, 10';
        homePerformers.appendChild(hp1);
        homePerformers.appendChild(hp2);

        awayCity.value = 'San Antonio';
        awayName.value = 'Spurs';
        awayScores.value = '134, 41, 25, 34, 22, 12';
        renderScorePreview(awayScorePreview, parseScores(awayScores.value));

        awayPerformers.innerHTML = '';
        const ap1 = createPerformerRow('away');
        ap1.querySelector('input').value = 'Victor Wembanyama, 34, 18, 7';
        const ap2 = createPerformerRow('away');
        ap2.querySelector('input').value = 'Stephon Castle, 20, 5, 4';
        awayPerformers.appendChild(ap1);
        awayPerformers.appendChild(ap2);
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
