'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleRequest } from '@/utils/auth-helpers/client';
import { updateListing } from '@/utils/auth-helpers/server';
import { Select, SelectItem, SelectSection } from '@heroui/select';
import { Avatar } from '@heroui/avatar';
import { Input, Textarea } from '@heroui/input';
import { NumberInput } from '@heroui/number-input';
import { Checkbox } from '@heroui/checkbox';
import Valide from '@/components/icons/Valide';
import { Tables } from '@/types_db';

import {
  dragonflyModels,
  currencies,
  countries,
  specificationsData
} from '../BoatListingForm/BoatListingForm'; // Import shared data from BoatListingForm

type Boat = Tables<'boats'>;

export default function EditListing({ boat }: { boat: Boat }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Form states - add type safety checks
  const [model, setModel] = useState(
    typeof boat.model === 'string' ? boat.model : ''
  );
  const [country, setCountry] = useState(
    typeof boat.country === 'string' ? boat.country : ''
  );
  const [priceBoat, setPriceBoat] = useState(
    typeof boat.price === 'number' ? boat.price : 0
  );
  const [currency, setCurrency] = useState(
    typeof boat.currency === 'string' ? boat.currency : 'USD'
  );

  // Handle specifications with proper type checking
  const [specifications, setSpecifications] = useState<string[]>(() => {
    if (typeof boat.specifications === 'string') {
      try {
        return JSON.parse(boat.specifications);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [vatPaid, setVatPaid] = useState(!!boat.vat_paid);
  const [description, setDescription] = useState(
    typeof boat.description === 'string' ? boat.description : ''
  );

  // Photo upload state with proper type checking
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>(() => {
    if (typeof boat.photos === 'string') {
      return boat.photos.split(',');
    }
    return [];
  });

  const [existingPhotos, setExistingPhotos] = useState<string[]>(() => {
    if (typeof boat.photos === 'string') {
      return boat.photos.split(',');
    }
    return [];
  });

  const getCurrencySymbol = (currency: string | null) => {
    if (!currency) return '';
    const currencyData = currencies.find(
      (c) => c.key === currency.toUpperCase()
    );
    return currencyData ? currencyData.symbol : currency.toUpperCase();
  };

  // Handlers for form fields
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setModel(e.target.value);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(e.target.value);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(e.target.value);
  };

  const handleSpecificationsChange = (keys: any) => {
    const selectedKeys = Array.from(keys).map((key) => String(key));
    setSpecifications(selectedKeys);
  };

  const handleVatPaidChange = (checked: boolean) => {
    setVatPaid(checked);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescription(e.target.value);
  };

  // Handle file selection for photos
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    setPhotoFiles((prev) => [...prev, ...newFiles]);

    // Generate previews for each new file
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreview((prev) => [...prev, ...newPreviews]);
  };

  // Remove a photo from the upload list or existing photos
  const removePhoto = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      // Find the actual index in the photoFiles array
      const actualIndex = index - existingPhotos.length;
      if (actualIndex >= 0) {
        setPhotoFiles((prev) => prev.filter((_, i) => i !== actualIndex));
        URL.revokeObjectURL(photoPreview[index]);
        setPhotoPreview((prev) =>
          [...existingPhotos, ...prev.slice(existingPhotos.length)].filter(
            (_, i) => i !== index
          )
        );
      }
    }
  };

  // Upload photos and return URLs
  const uploadPhotos = async (): Promise<string[]> => {
    if (photoFiles.length === 0) return [];

    setUploadingPhotos(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of photoFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        uploadedUrls.push(data.url);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw error;
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First upload any new photos
      let newPhotoUrls: string[] = [];
      if (photoFiles.length > 0) {
        try {
          newPhotoUrls = await uploadPhotos();
        } catch (error) {
          console.error('Failed to upload photos:', error);
          alert('There was a problem uploading your photos. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // Combine existing and new photo URLs
      const allPhotoUrls = [...existingPhotos, ...newPhotoUrls];

      // Create a FormData object for the update
      const formData = new FormData();
      formData.append('id', boat.id.toString());
      formData.append('model', model);
      formData.append('description', description);
      formData.append('country', country);
      formData.append('price', priceBoat.toString());
      formData.append('currency', currency);
      formData.append('specifications', JSON.stringify(specifications));
      formData.append('vat_paid', vatPaid ? 'true' : 'false');
      formData.append('photos', allPhotoUrls.join(','));

      // Call the update function with the FormData object
      await handleRequest(
        { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>,
        () => updateListing(formData),
        router
      );

      // Redirect to the listing detail page or listing management page
      router.push(`/account`);
    } catch (error) {
      console.error('Error updating listing:', error);
      alert('An error occurred while updating your listing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Combine existing and new photos for preview
  const allPhotoPreviews = [
    ...existingPhotos,
    ...photoPreview.slice(existingPhotos.length)
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full justify-center gap-[56px] pb-[112px] mx-auto max-w-screen-xl"
    >
      <div className="bg-lightgrey w-full p-[50px] flex flex-col gap-[48px] rounded-[24px]">
        <h1 className="text-40 text-oceanblue">
          <span className="text-articblue">Edit</span> your advert
        </h1>
        <div className="flex flex-col gap-[24px]">
          <Select
            classNames={{
              label: 'text-oceanblue',
              trigger: 'bg-fullwhite',
              value: 'text-oceanblue'
            }}
            className="text-oceanblue h-[40px]"
            labelPlacement="outside"
            size="lg"
            label="Model"
            placeholder="Select a model"
            selectedKeys={model ? [model] : []}
            onChange={handleModelChange}
            scrollShadowProps={{
              isEnabled: false
            }}
          >
            {dragonflyModels.map((modele) => (
              <SelectItem className="text-oceanblue" key={modele.key}>
                {modele.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            className="text-oceanblue h-[40px]"
            label="Country"
            size="lg"
            classNames={{
              label: 'text-oceanblue',
              trigger: 'bg-fullwhite',
              value: 'text-oceanblue'
            }}
            labelPlacement="outside"
            placeholder="Select a country"
            selectedKeys={country ? [country] : []}
            onChange={handleCountryChange}
          >
            {countries.map(({ key, label, flag }) => (
              <SelectItem
                className="text-oceanblue"
                key={key}
                startContent={
                  <Avatar alt={label} className="w-6 h-6" src={flag} />
                }
              >
                {label}
              </SelectItem>
            ))}
          </Select>

          <div className="flex flex-row gap-24 justify-center">
            <NumberInput
              className="text-oceanblue placeholder:text-oceanblue h-[40px]"
              label="Price"
              size="lg"
              classNames={{
                label: 'text-oceanblue',
                inputWrapper: 'bg-fullwhite',
                mainWrapper: 'h-fit',
                input: 'placeholder:text-oceanblue/40'
              }}
              labelPlacement="outside"
              placeholder="From 0$ to 25 000 $"
              value={priceBoat}
              onValueChange={setPriceBoat}
            />

            <Select
              classNames={{
                label: 'text-oceanblue',
                trigger: 'bg-fullwhite',
                value: 'text-oceanblue'
              }}
              className="text-oceanblue h-[40px] max-w-[100px]"
              labelPlacement="outside"
              size="lg"
              scrollShadowProps={{
                isEnabled: false
              }}
              startContent={getCurrencySymbol(currency)}
              label="Currency"
              selectedKeys={currency ? [currency] : ['USD']}
              onChange={handleCurrencyChange}
            >
              {currencies.map((curr) => (
                <SelectItem className="text-oceanblue" key={curr.key}>
                  {curr.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <Select
            selectionMode="multiple"
            className="text-oceanblue h-[40px] max-w-[512px]"
            size="lg"
            classNames={{
              label: 'text-oceanblue',
              trigger: 'bg-fullwhite',
              value: 'text-oceanblue'
            }}
            labelPlacement="outside"
            label="Specifications"
            placeholder="Select features"
            selectedKeys={new Set(specifications)}
            onSelectionChange={handleSpecificationsChange}
          >
            {specificationsData.map((section, index) => (
              <SelectSection
                key={section.title}
                title={section.title}
                showDivider={index !== specificationsData.length - 1}
              >
                {section.items.map((item) => (
                  <SelectItem key={item.key} className="text-oceanblue">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectSection>
            ))}
          </Select>

          <Checkbox
            color="success"
            className="text-fullwhite"
            classNames={{ icon: 'text-fullwhite' }}
            isSelected={vatPaid}
            onValueChange={handleVatPaidChange}
          >
            VAT paid
          </Checkbox>

          <Textarea
            classNames={{
              label: 'text-oceanblue',
              inputWrapper: 'bg-fullwhite',
              input: 'placeholder:text-oceanblue'
            }}
            className="text-oceanblue"
            labelPlacement="outside"
            size="lg"
            label="Description"
            minRows={6}
            placeholder="Enter your description"
            value={description}
            onValueChange={setDescription}
          />

          {/* Photo Upload Section */}
          <div className="space-y-4">
            <label className="block text-oceanblue">Photos</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="w-full text-oceanblue"
            />

            {allPhotoPreviews.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-4">
                {allPhotoPreviews.map((preview, index) => {
                  const isExisting = index < existingPhotos.length;
                  return (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-32 h-32 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index, isExisting)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-row gap-4 justify-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-stonegrey text-oceanblue font-medium px-[53px] py-[20px] rounded-[7px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-articblue text-white font-medium px-[53px] py-[20px] rounded-[7px]"
          disabled={isLoading || uploadingPhotos}
        >
          {isLoading || uploadingPhotos ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
