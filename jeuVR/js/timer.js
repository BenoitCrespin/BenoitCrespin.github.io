function createTimer() {
    let seconds = 0;
    let timerId = null;

    function updateTimer() {
        seconds++;
        console.log(seconds);
        document.querySelector('#timeText').setAttribute('text', 'value:Time: ' + seconds);
        timerId = setTimeout(updateTimer, 1000);
    }

    function start() {
        updateTimer();
    }

    function stop() {
        clearTimeout(timerId);
        timerId = null;
    }

    function reset() {
        seconds = 0;
        document.querySelector('#timeText').setAttribute('text', 'value:Time: ' + seconds);
    }

    return { start, stop, reset };
}

export default createTimer;