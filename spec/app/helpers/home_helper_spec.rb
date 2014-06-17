require 'spec_helper'

describe "HaroldtreenGithubIo::App::HomeHelper" do
  let(:helpers){ Class.new }
  before { helpers.extend HaroldtreenGithubIo::App::HomeHelper }
  subject { helpers }

  it "should return nil" do
    expect(subject.foo).to be_nil
  end
end
