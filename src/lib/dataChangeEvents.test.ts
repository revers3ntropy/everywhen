import { describe, it, expect, vi } from 'vitest';
import { listen, dispatch } from './dataChangeEvents';
import { onDestroy } from 'svelte';
import type { Entry } from '$lib/controllers/entry/entry';
import type { Label } from '$lib/controllers/label/label';
import type { AssetMetadata } from '$lib/controllers/asset/asset';
import type { Location } from '$lib/controllers/location/location';
import type { DatasetColumn } from '$lib/controllers/dataset/dataset';

// Mock the svelte module
vi.mock('svelte', () => ({
    onDestroy: vi.fn()
}));

describe('dataChangeEvents', () => {
    const mockOnDestroy = vi.mocked(onDestroy);

    it('should allow listening to and dispatching a create event', async () => {
        const createListener = vi.fn();
        const removeListener = listen.entry.onCreate(createListener);

        const newEntry = { id: '1', content: 'Test Entry' };
        await dispatch.create('entry', newEntry as unknown as Entry);

        expect(createListener).toHaveBeenCalledWith(newEntry);
        expect(createListener).toHaveBeenCalledTimes(1);

        removeListener();
    });

    it('should allow listening to and dispatching an update event', async () => {
        const updateListener = vi.fn();
        const removeListener = listen.label.onUpdate(updateListener);

        const oldLabel = { id: 'label1', name: 'Old Name' };
        const newLabel = { id: 'label1', name: 'New Name' };
        await dispatch.update('label', newLabel as unknown as Label, oldLabel as unknown as Label);

        expect(updateListener).toHaveBeenCalledWith(newLabel, oldLabel);
        expect(updateListener).toHaveBeenCalledTimes(1);

        removeListener();
    });

    it('should allow listening to and dispatching a delete event', async () => {
        const deleteListener = vi.fn();
        const removeListener = listen.event.onDelete(deleteListener);

        const eventId = 'event1';
        await dispatch.delete('event', eventId);

        expect(deleteListener).toHaveBeenCalledWith(eventId);
        expect(deleteListener).toHaveBeenCalledTimes(1);

        removeListener();
    });

    it('should call multiple listeners for the same event', async () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        const remove1 = listen.asset.onCreate(listener1);
        const remove2 = listen.asset.onCreate(listener2);

        const newAsset = { id: 'asset1', url: 'http://example.com/img.png' };
        await dispatch.create('asset', newAsset as unknown as AssetMetadata);

        expect(listener1).toHaveBeenCalledWith(newAsset);
        expect(listener2).toHaveBeenCalledWith(newAsset);

        remove1();
        remove2();
    });

    it('should not call listeners for other entities', async () => {
        const entryListener = vi.fn();
        const labelListener = vi.fn();

        const removeEntryListener = listen.entry.onCreate(entryListener);
        const removeLabelListener = listen.label.onCreate(labelListener);

        const newEntry = { id: '1', content: 'Test' };
        await dispatch.create('entry', newEntry as unknown as Entry);

        expect(entryListener).toHaveBeenCalledTimes(1);
        expect(labelListener).not.toHaveBeenCalled();

        removeEntryListener();
        removeLabelListener();
    });

    it('should correctly remove a listener', async () => {
        const listener = vi.fn();
        const removeListener = listen.location.onCreate(listener);

        removeListener();

        const newLocation = { id: 'loc1', name: 'Test Location' };
        await dispatch.create('location', newLocation as unknown as Location);

        expect(listener).not.toHaveBeenCalled();
    });

    it('should register onDestroy when a listener is added', () => {
        const listener = vi.fn();
        const removeListener = listen.dataset.onCreate(listener);

        expect(mockOnDestroy).toHaveBeenCalled();

        removeListener();
    });

    it('should handle datasetCol and datasetRow events', async () => {
        const colListener = vi.fn();
        const rowListener = vi.fn();

        const removeCol = listen.datasetCol.onCreate(colListener);
        const removeRow = listen.datasetRow.onDelete(rowListener);

        const newCol = { id: 'col1', type: 'string' };
        await dispatch.create('datasetCol', newCol as unknown as DatasetColumn<unknown>);
        expect(colListener).toHaveBeenCalledWith(newCol);

        const rowToDelete = { datasetId: 'ds1', rowId: 123 };
        await dispatch.delete('datasetRow', rowToDelete);
        expect(rowListener).toHaveBeenCalledWith(rowToDelete);

        removeCol();
        removeRow();
    });
});
