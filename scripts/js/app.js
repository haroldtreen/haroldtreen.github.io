app = {};

app.load = function(section){

	ga('send', 'event', 'Navigation', 'click', section);

	$('.container').fadeOut("normal", function(){
			$('.container').load("/src/html/" + section + ".html", function(){
					$('.container').fadeIn('normal');
					app.trackClicks();
			});
	});
};

$(document).ready(function(){
	app.load('about');
});

app.trackClicks = function(){
	$('a.track').click(function(event){
		var linkValue = $(this).attr('href');
		ga('send', 'event', 'Link', 'click', linkValue);
	});
	$('a.track').removeClass('track').addClass('tracked');
};
