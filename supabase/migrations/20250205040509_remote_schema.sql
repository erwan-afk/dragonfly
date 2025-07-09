CREATE TRIGGER create_profile_from_auth AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_user_profile();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


