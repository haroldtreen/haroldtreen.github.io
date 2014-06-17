HaroldtreenGithubIo::App.controllers :home do
  
  get :home, :map => '/' do
    render 'index'
  end

  get :projects, :map => '/projects' do
    render 'projects'
  end

  get :about, :map => '/about' do
    render 'about'
  end

  get :contact, :map => '/contact' do
    render 'contact'
  end


  # get :sample, :map => '/sample/url', :provides => [:any, :js] do
  #   case content_type
  #     when :js then ...
  #     else ...
  # end

  # get :foo, :with => :id do
  #   'Maps to url '/foo/#{params[:id]}''
  # end

  # get '/example' do
  #   'Hello world!'
  # end
  

end
