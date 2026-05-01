let musicList = [];
let genreList = ["ボカロ", "アニソン", "J-POP"];
let currentIndex = 0;
let scrollOffset = 0;

// スクロールオブジェクトの取得
let scrollElm = (function () {
    if ('scrollingElement' in document) {
        return document.scrollingElement;
    }
    if (navigator.userAgent.indexOf('WebKit') != -1) {
        return document.body;
    }
    return document.documentElement;
})();

/* ダブルタップによる拡大を禁止 */
var t = 0;
document.documentElement.addEventListener('touchend', function (e) {
    var now = new Date().getTime();
    if ((now - t) < 350) {
        e.preventDefault();
    }
    t = now;
}, false);

/* ピッチインピッチアウトによる拡大縮小を禁止 */
document.documentElement.addEventListener('touchstart', function (e) {
    if (e.touches.length >= 2) {
        e.preventDefault();
    }
}, {
    passive: false
});



// beforeStrと一致するすべての要素をafterStrに置き換える
String.prototype.replaceAll = function (beforeStr, afterStr) {
    let reg = new RegExp(beforeStr, "g");
    return this.replace(reg, afterStr);
};

// 文字列のエスケープ処理
function escapeHTML(str) {
    str = str.replaceAll("&", '&amp;');
    str = str.replaceAll("<", '&lt;');
    str = str.replaceAll(">", '&gt;');
    str = str.replaceAll("\"", '&quot;');
    str = str.replaceAll("'", '&#39;');
    return str;
}

// エスケープ処理された文字列を復号する
function reverceEscapeHTML(str) {
    str = str.replaceAll("&amp;", "&");
    str = str.replaceAll("&lt;", "<");
    str = str.replaceAll("&gt;", ">");
    str = str.replaceAll("&quot;", "\"");
    str = str.replaceAll("&#39;", "'");
    return str;
}


// ローカルストレージから楽曲のセーブデータを読み込む
function loadSaveDatas() {
    // 楽曲データの読み込み
    let rawMusicList = localStorage.getItem("MusicList");
    if (rawMusicList) {
        try {
            musicList = JSON.parse(rawMusicList.toString());
        } catch (error) {
            alert("楽曲データを正常に読み込めませんでした(不正なJSON形式)");
        }
    }

    // ジャンルリストの読み込み
    let rawGenreList = localStorage.getItem("GenreList");
    if (rawGenreList) {
        try {
            genreList = JSON.parse(rawGenreList.toString());
        } catch (error) {
            alert("ジャンルデータを正常に読み込めませんでした(不正なJSON形式)");
        }
    }

    // 最後に選択していた機種の読み込み
    let currentModel = localStorage.getItem("Model");
    if (currentModel) {
        document.getElementById("model").value = currentModel;
    }

    // 最後に選択していたソートモードの読み込み
    let sortMode = localStorage.getItem("SortMode");
    if (sortMode) {
        document.getElementById("sort-mode").value = sortMode;
    }

    // 最後に設定していた検索ワードの読み込み
    let searchWords = localStorage.getItem("SearchWords");
    if (searchWords) {
        document.getElementById("search-word").value = searchWords;
    }
}

// HTMLオブジェクトにデータを反映する
function updateHTMLObject() {
    let musicListPanel = document.getElementById("music-panel-list");
    let currentModel = document.getElementById("model").value;

    // 検索ワードをスペース区切りで分割
    let searchWords = document.getElementById("search-word").value.split(/\s+/);
    searchWords = searchWords.filter(function (e) {
        return e !== "";
    });

    musicListPanel.innerHTML = "";

    // 楽曲リストのソート
    let sortMode = document.getElementById("sort-mode").value;
    sortMusicList(sortMode);

    for (let i = 0; i < musicList.length; i++) {
        //ワード検索
        if (0 < searchWords.length) {
            let searchFlag = 0;
            for (let j = 0; j < searchWords.length; j++) {
                let containGenre = false;

                if (musicList[i].genreList == undefined) {
                    musicList[i].genreList = [];
                }
                // 一つでも検索ワードと一致するものがあれば表示する
                for (let k = 0; k < musicList[i].genreList.length; k++) {
                    if (musicList[i].genreList[k].indexOf(searchWords[j]) != -1) {
                        containGenre = true;
                        break;
                    }
                }

                if (musicList[i].title.indexOf(searchWords[j]) != -1 ||
                    musicList[i].artist.indexOf(searchWords[j]) != -1 ||
                    containGenre
                ) {
                    searchFlag++;
                }
            }
            if (searchFlag != searchWords.length) {
                continue;
            }
        }
        //検索ここまで

        // 曲ごとのエレメントを生成
        let newDiv = document.createElement("div");
        newDiv.classList.add("music-panel");

        let favText = "";
        for (let j = 0; j < 10; j++) {
            favText += j < parseInt(musicList[i].favorite) ? "★" : "☆";
        }
        let score = musicList[i].score[currentModel];
        if (score == undefined) score = 0;
        
        // リリース年の表示（データがない場合は表示しない）
        let releaseYearText = musicList[i].releaseYear ? ` (${musicList[i].releaseYear})` : "";

        newDiv.innerHTML = "<span class=\"title\">" + musicList[i].title + releaseYearText + "</span><span class=\"artist\">" + musicList[i].artist + "</span><div>" + "<span class=\"score\">" + score + "</span><span class=\"key\">" + musicList[i].key + "</span><span class=\"favorite\">" + favText + "</span>";
        newDiv.json = musicList[i];
        newDiv.index = i;

        // クリック時に曲設定パネルを開くように設定
        newDiv.addEventListener("click", function (evt) {
            showMusicAddPanel(evt.currentTarget);
        });

        musicListPanel.appendChild(newDiv);
    }
    changeHeaderModel();


    // ローカルストレージの更新
    localStorage.setItem("MusicList", JSON.stringify(musicList));
    localStorage.setItem("Model", currentModel);
    localStorage.setItem("SortMode", document.getElementById("sort-mode").value);
    localStorage.setItem("GenreList", JSON.stringify(genreList));
    localStorage.setItem("SearchWords", document.getElementById("search-word").value);
}

function changeHeaderModel() {
    // 画面上部の機種表示を更新
    let headerModel = document.getElementById("header-model");
    headerModel.innerHTML = document.getElementById("model").value;
}

// 曲順のソート
function sortMusicList(sortMode) {
    let currentModel = document.getElementById("model").value;
    if (sortMode == "低得点順") {
        musicList.sort((a, b) => {
            let aScore = a.score[currentModel];
            if (aScore == undefined) aScore = 0;
            if (aScore < 0) aScore = 1000000;
            let bScore = b.score[currentModel];
            if (bScore == undefined) bScore = 0;
            if (bScore < 0) bScore = 1000000;
            return aScore - bScore;
        });
    } else if (sortMode == "お気に入り順") {
        musicList.sort((a, b) => {
            let aFavorite = a.favorite;
            if (aFavorite == undefined) aFavorite = 0;
            let bFavorite = b.favorite;
            if (bFavorite == undefined) bFavorite = 0;

            return bFavorite - aFavorite;
        });
    } else if (sortMode == "お気に入り逆順") {
        musicList.sort((a, b) => {
            let aFavorite = a.favorite;
            if (aFavorite == undefined) aFavorite = 0;
            let bFavorite = b.favorite;
            if (bFavorite == undefined) bFavorite = 0;

            return aFavorite - bFavorite;
        });
    } else if (sortMode == "リリース順") {
        musicList.sort((a, b) => {
            let aYear = a.releaseYear ? parseInt(a.releaseYear) : 0;
            let bYear = b.releaseYear ? parseInt(b.releaseYear) : 0;
            return aYear - bYear;
        });
    } else if (sortMode == "リリース逆順") {
        musicList.sort((a, b) => {
            let aYear = a.releaseYear ? parseInt(a.releaseYear) : 0;
            let bYear = b.releaseYear ? parseInt(b.releaseYear) : 0;
            return bYear - aYear;
        });
    } else if (sortMode == "アーティスト順") {
        for (let i = 1, end = musicList.length; i < end; i++) {
            let last = musicList[i];
            let j = i - 1;
            let A = musicList[i].artist;
            while (0 <= j && A < musicList[j].artist) {
                musicList[j + 1] = musicList[j];
                j--;
            }
            musicList[j + 1] = last;
        }
    } else if (sortMode == "曲名順") {
        for (let i = 1, end = musicList.length; i < end; i++) {
            let last = musicList[i];
            let j = i - 1;
            let lastTitle = musicList[i].title;
            while (0 <= j && lastTitle < musicList[j].title) {
                musicList[j + 1] = musicList[j];
                j--;
            }
            musicList[j + 1] = last;
        }
    } else if (sortMode == "ランダム") {
        musicList.sort(function () {
            Math.random() - .5;
        });
    } else { //高得点順
        musicList.sort((a, b) => {
            let aScore = a.score[currentModel];
            if (aScore == undefined) aScore = 0;
            let bScore = b.score[currentModel];
            if (bScore == undefined) bScore = 0;
            return bScore - aScore;
        });

    }
}


// スクロール位置の更新
function updateScrollOffset() {
    if (document.getElementById("music-panel-list").style.display == "block") {
        scrollOffset = scrollElm.scrollTop;
    }
    scrollElm.scrollTop = 0;
}

// すべてのパネルを非表示にする
function hideAllPanel() {
    document.getElementById("music-panel-list").style.display = "none";
    document.getElementById("change-sort-panel").style.display = "none";
    document.getElementById("add-music-panel").style.display = "none";
    document.getElementById("change-model-panel").style.display = "none";
    document.getElementById("edit-json-panel").style.display = "none";
    document.getElementById("search-panel").style.display = "none";
    document.getElementById("genre-tag-panel").style.display = "none";
    document.getElementById("stats-panel").style.display = "none";

    document.getElementById("nav-input").checked = false;
}

// 楽曲リストパネルの表示
function showMusicPanelList() {
    hideAllPanel();
    updateHTMLObject();

    document.getElementById("music-panel-list").style.display = "block";
    document.getElementById("search-panel").style.display = "flex";
    scrollElm.scrollTop = scrollOffset;
}

//ソートパネルの表示
function showChangeSortPanel() {
    updateScrollOffset();
    hideAllPanel();

    document.getElementById("change-sort-panel").style.display = "block";
}

//曲の追加パネルを開く
function showMusicAddPanel(element) {
    let addMusicPanel = document.getElementById("add-music-panel");
    if (element == undefined) {
        // 楽曲データの新規作成
        document.getElementById("music-title").value = "";
        document.getElementById("music-artist").value = "";
        document.getElementById("music-score").value = 0.0;
        document.getElementById("music-key").value = "♭0";
        document.getElementById("music-favorite").value = 1;
        document.getElementById("music-release-year").value = "";
        currentIndex = musicList.length;
    } else {
        // 既存の楽曲データの編集
        let json = element.json;
        let currentModel = document.getElementById("model").value;
        let score = json.score[currentModel];
        if (score == undefined) {
            score = 0.0;
        }
        document.getElementById("music-title").value = reverceEscapeHTML(json.title);
        document.getElementById("music-artist").value = reverceEscapeHTML(json.artist);
        document.getElementById("music-score").value = score;
        document.getElementById("music-key").value = json.key;
        document.getElementById("music-favorite").value = json.favorite;
        document.getElementById("music-release-year").value = json.releaseYear || "";
        currentIndex = element.index;
    }

    let elementGenreList = [];
    if (element != undefined) {
        elementGenreList = element.json.genreList;
    }
    createGenreButtons(elementGenreList);

    updateScrollOffset();
    hideAllPanel();
    addMusicPanel.style.display = "block";
}

// 楽曲データの追加
function addMusic() {
    let currentModel = document.getElementById("model").value;
    let genreListBox = document.getElementById("genre-list");

    let newMusic = {};
    newMusic.title = escapeHTML(document.getElementById("music-title").value);
    newMusic.artist = escapeHTML(document.getElementById("music-artist").value);
    if (currentIndex == musicList.length) {
        // 新規データ
        newMusic.score = {};
    } else {
        // 既存のデータを読み込む
        newMusic.score = musicList[currentIndex].score;
    }
    newMusic.score[currentModel] = parseFloat(document.getElementById("music-score").value);
    newMusic.key = document.getElementById("music-key").value;
    newMusic.favorite = document.getElementById("music-favorite").value;
    newMusic.releaseYear = document.getElementById("music-release-year").value;

    // ジャンル設定の読み込み
    if (0 < genreListBox.children.length) {
        newMusic.genreList = [];
        for (let i = 0; i < genreListBox.children.length; i++) {
            let elem = genreListBox.children[i];
            if (elem.className.indexOf("genre-btn-s") != -1) {
                newMusic.genreList.push(elem.innerText);
            }
        }
    }

    // 新規作成時のみ重複判定
    let addFlag = true;
    if (currentIndex == musicList.length) {
        for (let i = 0; i < musicList.length; i++) {
            if (musicList[i].title == newMusic.title) {
                let result = window.confirm("同名の曲がありますが追加しますか？\nartist : " + musicList[i].artist);
                if (!result) {
                    addFlag = false;
                    break;
                }
            }
        }
    }
    if (addFlag) {
        musicList[currentIndex] = newMusic;
    }

    showMusicPanelList();
}

// 楽曲追加パネルにジャンルボタンを作成
function createGenreButtons(list) {
    if (list == undefined) list = [];
    let genreListBox = document.getElementById("genre-list");

    genreListBox.innerHTML = "";
    for (let i = 0; i < genreList.length; i++) {
        let elem = document.createElement("button");
        elem.className = "genre-btn";
        elem.setAttribute("type", "button");
        elem.innerText = genreList[i];
        elem.addEventListener("click", function (evt) {
            let classN = evt.currentTarget.className;
            if (classN.indexOf("genre-btn-s") == -1) {
                evt.currentTarget.className = "genre-btn genre-btn-s";
            } else {
                evt.currentTarget.className = "genre-btn";
            }
        });

        if (list.includes(genreList[i])) {
            elem.className = "genre-btn genre-btn-s";
        }

        genreListBox.appendChild(elem);
    }
}

// 現在選択中の楽曲データを削除
// 選択はshowMusicAddPanelを実行したときに変更される
function deleteMusic() {
    let result = window.confirm("楽曲を削除しますか？");
    if (result) {
        if (0 <= currentIndex && currentIndex < musicList.length) {
            let addMusicPanel = document.getElementById("add-music-panel");

            musicList.splice(currentIndex, 1);

            localStorage.setItem("MusicList", JSON.stringify(musicList));
        }
        showMusicPanelList();
    }
}

// 検索ボックスのクリア
function clearSearchFilter() {
    document.getElementById("search-word").value = "";
}

//機種変更パネルを表示する
function showChangeModelPanel() {
    updateScrollOffset();
    hideAllPanel();
    document.getElementById("change-model-panel").style.display = "block";
}

// ジャンルリストの更新
function updateGenreList() {
    let genreEditField = document.getElementById("genre-edit-field");
    genreEditField.value = genreEditField.value.replace(/\r?\n/g, '');
    genreEditField.value = genreEditField.value.replace(/(\<|\>|&|\\|\"|\')/g, '');
    genreList = genreEditField.value.split(",");
    // 重複の削除
    genreList = genreList.filter(function (x, i, self) {
        return self.indexOf(x) === i;
    });
    genreEditField.value = genreList.join(',');
    showMusicPanelList();
}

function test() {
    alert("asfaf");
}

//ジャンルパネルを表示する
function showGenreTagPanel() {
    try {
        document.getElementById("genre-edit-field").value = genreList.join(',');
    } catch {

    }
    updateScrollOffset();
    hideAllPanel();

    document.getElementById("genre-tag-panel").style.display = "block";
}


// 統計パネルを表示する
function showStatsPanel() {
    updateScrollOffset();
    hideAllPanel();

    let currentModel = document.getElementById("model").value;

    // 現在の機種ラベルを更新
    document.getElementById("stats-model-label").textContent = "機種: " + currentModel;

    // 有効なスコアを収集（0以上のもの）
    let scores = [];
    for (let i = 0; i < musicList.length; i++) {
        let s = musicList[i].score[currentModel];
        if (s !== undefined && s > 0) {
            scores.push(parseFloat(s));
        }
    }

    if (scores.length === 0) {
        document.getElementById("stats-min").textContent = "-";
        document.getElementById("stats-max").textContent = "-";
        document.getElementById("stats-avg").textContent = "-";
        document.getElementById("stats-med").textContent = "-";
        document.getElementById("stats-top3").innerHTML = "<li>データがありません</li>";
        // ヒストグラムをクリア
        let canvas = document.getElementById("stats-histogram");
        let ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById("stats-panel").style.display = "block";
        return;
    }

    // 基本統計量の計算
    let minScore = Math.min.apply(null, scores);
    let maxScore = Math.max.apply(null, scores);
    let sum = scores.reduce(function(a, b) { return a + b; }, 0);
    let avgScore = sum / scores.length;

    let sorted = scores.slice().sort(function(a, b) { return a - b; });
    let mid = Math.floor(sorted.length / 2);
    let medScore = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

    document.getElementById("stats-min").textContent = minScore.toFixed(2);
    document.getElementById("stats-max").textContent = maxScore.toFixed(2);
    document.getElementById("stats-avg").textContent = avgScore.toFixed(2);
    document.getElementById("stats-med").textContent = medScore.toFixed(2);

    // 上位3曲
    let ranked = musicList
        .filter(function(m) {
            let s = m.score[currentModel];
            return s !== undefined && s > 0;
        })
        .map(function(m) {
            return { title: m.title, artist: m.artist, score: parseFloat(m.score[currentModel]) };
        })
        .sort(function(a, b) { return b.score - a.score; })
        .slice(0, 3);

    let top3El = document.getElementById("stats-top3");
    top3El.innerHTML = "";
    for (let i = 0; i < ranked.length; i++) {
        let li = document.createElement("li");
        li.innerHTML = "<span class='stats-top3-score'>" + ranked[i].score.toFixed(2) + "</span> "
            + "<span class='stats-top3-title'>" + ranked[i].title + "</span>"
            + "<span class='stats-top3-artist'>" + ranked[i].artist + "</span>";
        top3El.appendChild(li);
    }

    // ヒストグラムの描画
    drawHistogram(scores, minScore, maxScore);

    document.getElementById("stats-panel").style.display = "block";
}

// ヒストグラムを描画する
function drawHistogram(scores, minScore, maxScore) {
    let canvas = document.getElementById("stats-histogram");
    // canvasの表示幅に合わせてサイズを調整
    let displayWidth = canvas.parentElement.clientWidth - 20;
    if (displayWidth > 0) {
        canvas.width = displayWidth;
    }
    let W = canvas.width;
    let H = canvas.height;
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    let BIN_COUNT = 10;
    let range = maxScore - minScore;
    let binSize = range <= 0 ? 1 : range / BIN_COUNT;

    // ビンのカウント
    let bins = new Array(BIN_COUNT).fill(0);
    for (let i = 0; i < scores.length; i++) {
        let idx = Math.floor((scores[i] - minScore) / binSize);
        if (idx >= BIN_COUNT) idx = BIN_COUNT - 1;
        bins[idx]++;
    }

    let maxCount = Math.max.apply(null, bins);
    if (maxCount === 0) return;

    let padL = 36, padR = 10, padT = 10, padB = 36;
    let chartW = W - padL - padR;
    let chartH = H - padT - padB;
    let barW = chartW / BIN_COUNT;

    // 軸
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + chartH);
    ctx.lineTo(padL + chartW, padT + chartH);
    ctx.stroke();

    // バー
    for (let i = 0; i < BIN_COUNT; i++) {
        let barH = (bins[i] / maxCount) * chartH;
        let x = padL + i * barW;
        let y = padT + chartH - barH;

        // グラデーション
        let grad = ctx.createLinearGradient(x, y, x, padT + chartH);
        grad.addColorStop(0, "#4a9eda");
        grad.addColorStop(1, "#1a5fa0");
        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y, barW - 2, barH);

        // カウント数の表示（バーが十分な高さの場合）
        if (bins[i] > 0) {
            ctx.fillStyle = "#333";
            ctx.font = "10px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(bins[i], x + barW / 2, y - 2);
        }
    }

    // X軸ラベル（最小・中間・最大）
    ctx.fillStyle = "#555";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    let labelCount = 5;
    for (let i = 0; i <= labelCount; i++) {
        let val = minScore + (range / labelCount) * i;
        let x = padL + (chartW / labelCount) * i;
        ctx.fillText(val.toFixed(1), x, padT + chartH + 14);
    }

    // Y軸ラベル
    ctx.textAlign = "right";
    ctx.fillText("0", padL - 4, padT + chartH);
    ctx.fillText(maxCount, padL - 4, padT + 8);
}

//JSONの編集パネルの表示
function showEditJSONPanel() {
    document.getElementById("edit-area").innerHTML = "編集エリア(全" + musicList.length + "曲)";
    document.getElementById("json-edit-field").value = JSON.stringify(musicList, undefined, "    ");

    updateScrollOffset();
    hideAllPanel();
    document.getElementById("edit-json-panel").style.display = "block";
}

//　ユーザの編集した楽曲データのJSONを適用する
function applyJSON() {
    try {
        musicList = JSON.parse(document.getElementById("json-edit-field").value);
    } catch (error) {
        alert("JSONの適用に失敗しました");
    }
    showMusicPanelList();
}

// ホームアプリ化を促すポップアップを非表示にする
function disablePopup() {
    document.getElementById("pop").style.display = "none";
}

function saveJSON() {
    const a = document.createElement('a');
    a.href = 'data:text/plain,' + encodeURIComponent(JSON.stringify(musicList));
    a.download = 'test.txt';

    a.click();
}

function loadJSON() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        const showOpenFileDialog = () => {
            return new Promise(resolve => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.txt, text/plain';
                input.onchange = event => {
                    resolve(event.target.files[0]);
                };
                input.click();
            });
        };
        const readAsText = file => {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.readAsText(file);
                reader.onload = () => {
                    resolve(reader.result);
                };
            });
        };

        (async () => {
            const file = await showOpenFileDialog();
            const content = await readAsText(file);

            // 内容表示
            document.getElementById("json-edit-field").value = content;
        })();
    } else {
        alert('ファイルオープンが無効なブラウザです');
    }
}


loadSaveDatas();
showMusicPanelList();


if ((window.matchMedia('(display-mode: standalone)').matches)) {
    disablePopup();
}