var rowTwo = document.querySelector(".rowTwo");
var easy = document.querySelector("#easy");
var hard = document.querySelector("#hard");
var colorBlock = document.querySelectorAll(".colorBlock");
var header = document.querySelector("#header");
var reset = document.querySelector("#reset");
var rgbTitle = document.querySelector("#rgbTitle");
var hintMes = document.querySelector("#hintMes");
var blockNum =6;
var gameOver = false;


//easy hard mode switch
easy.addEventListener("click",function(){
	rowTwo.classList.add("none");
	easy.classList.add("selected");
	hard.classList.remove("selected");
	blockNum = 3;
	colorRandom();
});


hard.addEventListener("click",function(){
	rowTwo.classList.remove("none");
	hard.classList.add("selected");
	easy.classList.remove("selected");
	blockNum = 6;
	colorRandom();
});

/*when click new color or play again,
1.reset color
2.reset rgbTitle
*/
colorRandom(); //run when open the window
reset.addEventListener("click",colorRandom);//run when click

/*when click colorBlock,
1.wrong, block disappear with transition-delay, show Try Again
2.correct, all block+rgbTitle-bgcolor show the correct color, show Correct!*/
for(var i=0;i<colorBlock.length;i++){
	colorBlock[i].addEventListener("click",gameING);	
}



function gameING(){
	if(!gameOver){
			if(this.style.background==rgbTitle.textContent){
				//show correct
				hintMes.textContent = "CORRECT!";
				header.style.background = rgbTitle.textContent;
				//all block show again and have the same color
				for(var j=0;j<colorBlock.length;j++){
					colorBlock[j].style.background = rgbTitle.textContent;
					colorBlock[j].classList.remove("hide");
				}
				reset.textContent = "PLAY AGAIN?";
				gameOver = true;


			}else{
				//show wrong
				hintMes.textContent = "TRY AGAIN!";
				//wrong block disappear
				this.classList.add("hide");
			}
		}
}




function colorRandom(){
	gameOver = false;
	header.style.background = "#e63462";
	hintMes.textContent = "";
	reset.textContent = "NEW COLOR";
	var colorArray=[];

	for(var i=0;i<blockNum;i++){
		var colorNum1 = Math.ceil(Math.random()*255);
		var colorNum2 = Math.ceil(Math.random()*255);
		var colorNum3 = Math.ceil(Math.random()*255);
		var colorRGB = "rgb("+colorNum1+", "+colorNum2+", "+colorNum3+")";
		colorBlock[i].style.background = colorRGB;	
		colorArray.push(colorRGB);
	}

	var title = Math.ceil(Math.random()*(blockNum-1));
	rgbTitle.textContent = colorArray[title]; 
}