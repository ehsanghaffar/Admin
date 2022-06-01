import AuthenticatedRoute from '@tryghost/admin/routes/authenticated';

export default class IndexRoute extends AuthenticatedRoute {
    beforeModel() {
        super.beforeModel(...arguments);
        this.replaceWith('editor.new', 'post');
    }
}
