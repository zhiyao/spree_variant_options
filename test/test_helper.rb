# Configure Rails Envinronment
ENV["RAILS_ENV"] = "test"

require File.expand_path("../dummy/config/environment.rb",  __FILE__)
require "rails/test_help"

require 'ffaker'
require "shoulda"
require "sqlite3"

begin; require "debugger"; rescue LoadError; end
begin; require "turn"; rescue LoadError; end

require 'spree/testing_support/factories'

Dir["#{File.dirname(__FILE__)}/support/**/*.rb"].each { |f| require f }

require 'capybara/rails'

Capybara.default_driver = :selenium

class ActionDispatch::IntegrationTest
  # Make the Capybara DSL available in all integration tests
  include Capybara::DSL
  include Spree::UrlHelpers

  # Stop ActiveRecord from wrapping tests in transactions
  self.use_transactional_fixtures = true

  teardown do
    Capybara.reset_sessions!    # Forget the (simulated) browser state
    Capybara.use_default_driver # Revert Capybara.current_driver to Capybara.default_driver
  end
end

class Test::Unit::TestCase
  include FactoryGirl::Syntax::Methods
end