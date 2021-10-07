import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import {action} from '@ember/object';
import {bind} from '@ember/runloop';
import {inject as service} from '@ember/service';

export default class SettingsMembershipOfferRoute extends AuthenticatedRoute {
    @service feature;
    @service modals;
    @service settings;

    offerModal = null;
    confirmModal = null;
    hasConfirmed = false;

    beforeModel() {
        super.beforeModel(...arguments);

        if (!this.session.user.isAdmin) {
            return this.transitionTo('site');
        }

        if (!this.feature.offers) {
            return this.transitionTo('settings');
        }
    }

    activate() {
        this.offerModal = this.modals.open('modals/membership/offer', {
            saveTask: this.controllerFor('settings.membership.offer').saveTask
        }, {
            className: 'fullscreen-modal-wide fullscreen-modal-action fullscreen-modal-edit-offer',
            beforeClose: bind(this, this.beforeModalClose)
        });
    }

    @action
    willTransition(transition) {
        if (this.hasConfirmed) {
            return true;
        }

        // always abort when not confirmed because Ember's router doesn't automatically wait on promises
        transition.abort();

        this.confirmUnsavedChanges().then((shouldLeave) => {
            if (shouldLeave) {
                this.hasConfirmed = true;
                return transition.retry();
            }
        });
    }

    deactivate() {
        this.offerModal?.close();
        this.offerModal = null;
        this.confirmModal = null;
        this.hasConfirmed = false;
    }

    async beforeModalClose() {
        if (this.hasConfirmed) {
            return;
        }

        const shouldLeave = await this.confirmUnsavedChanges();

        if (shouldLeave === true) {
            this.transitionTo('settings.membership');
        } else {
            // prevent modal from closing
            return false;
        }
    }

    confirmUnsavedChanges() {
        if (!this.settings.get('hasDirtyAttributes')) {
            return Promise.resolve(true);
        }

        if (!this.confirmModal) {
            this.confirmModal = this.modals.open('modals/confirm-unsaved-changes')
                .then((discardChanges) => {
                    if (discardChanges === true) {
                        this.settings.rollbackAttributes();
                    }
                    return discardChanges;
                }).finally(() => {
                    this.confirmModal = null;
                });
        }

        return this.confirmModal;
    }
}