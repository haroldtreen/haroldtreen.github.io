app = {};

app.load = function(section){
	console.log(section)
	$(".container").load(section + ".html")
}
