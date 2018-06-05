/**
 * Partial type definiations for angular-datatables v0.6.X
 *
 * For more information: http://l-lin.github.io/angular-datatables/archives/#!/welcome
 */
import * as angular from 'angular';

declare module 'angular' {

    namespace datatables {
        interface DTOptionsBuilderService {
            fromFnPromise<T>(fn: () => PromiseLike<T>): DTOptionsBuilderService;

            withBootstrap(): DTOptionsBuilderService;

            withPaginationType(type: 'full_numbers'): DTOptionsBuilderService;

            withDOM(dom: string): DTOptionsBuilderService;
        }

        interface DTColumnBuilderService {
            newColumn(target: string): DTColumnBuilder;
        }

        interface DTColumnBuilder {
            withTitle(title: string): DTColumnBuilder;

            withOption(opt: string, val: any): DTColumnBuilder;

            renderWith(fn: (data: any, type: string, full: any, meta: {}) => string): DTColumnBuilder;
        }
    }
}
