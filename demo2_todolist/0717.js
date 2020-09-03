$("#content").on("click",".list",function(){
	$(this).toggleClass("done");
});

$("#content").on("click",".trashCan",function(){
	$(this).parent().remove();
});


$("#add").on("click",function(){
	$("#addTodo").slideToggle("none");
});


$("input").on("keypress",function(e){
	if(e.which=='13'){
		

		var x = $(this).val();

		if (x.match(/[\u3400-\u9FBF]/) && x.length >= 20) {
            $(this).val(x.substring(0,20));
        } else if (x.length >= 50){
            $(this).val(x.substring(0,45));
        }

        var value = $(this).val();
		var newTodo = "<div class='items'><div class='trashCan'><span><i class='fa fa-trash-o' aria-hidden='true'></i></span></div><div class='list'>"+value+"</div></div>";

		$("#content").append(newTodo);
    	

    	$(this).val("");
		
	}
});