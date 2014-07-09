app = {};

app.load = function(section){
	console.log(section);

	$('.container').fadeOut("normal", function(){
			$('.container').load("/src/html/" + section + ".html", function(){
					$('.container').fadeIn('normal');
			});
	});
};

$(document).ready(function(){
	app.load('about');
});
