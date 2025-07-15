let display = document.getElementById('display');
let buttons = document.querySelectorAll('.buttons button');

let string = "";

buttons.forEach(button => {
    button.addEventListener('click', (e) => {
        if (e.target.innerText == '=') {
            try {
                string = String(eval(string));
                display.value = string;
            } catch (error) {
                display.value = 'Error';
                string = "";
            }
        } else if (e.target.innerText == 'AC') {
            string = "";
            display.value = string;
        } else if (e.target.innerText == 'DEL') {
            string = string.substring(0, string.length - 1);
            display.value = string;
        } else {
            string = string + e.target.innerText;
            display.value = string;
        }
    })
})
