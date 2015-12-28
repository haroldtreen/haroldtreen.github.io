app = {};

app.load = function(section){
	ga('send', 'pageview', {
		'title': section 
	});

	$('.container').fadeOut("normal", function(){
			$('.container').load("/src/html/" + section + ".html", function(){
					$('.container').fadeIn('normal', function(){ app.trackClicks(); });
			});
	});
};

$(document).ready(function(){
	app.load('about');
});

app.trackClicks = function(){
	$('a.track').on('click', function(event){
		event.preventDefault();
		var linkValue = $(this).attr('href');
		ga('send', 'event', 'Link', 'click', linkValue, {
			'hitCallback': function(){ document.location = linkValue }
		});
	});
	$('a.track').removeClass('track').addClass('tracked');
};
